# Canvas editor architecture (Fabric.js + Liveblocks + Clerk + Mongo/Express)

Below is a lean, production-minded architecture that satisfies all functional/non-functional requirements and the given tech constraints, while keeping implementation scope realistic for a 48-hour sprint.

---

## High-level

**Stack**

* **Frontend:** React (TS) + Redux Toolkit, **Fabric.js** for canvas, **Liveblocks** for realtime storage/presence/history, **Clerk** for auth.
* **Backend:** Node.js + Express, **Mongoose** (MongoDB Atlas/local), **Zod** for request validation, **Liveblocks auth endpoint**.
* **Tests:** Jest + React Testing Library (unit), Playwright (E2E).
* **CI:** GitHub Actions (lint + tests).

**Core idea**

* The *canonical collaborative document* (layers + comments + cursors + selections) lives in **Liveblocks Storage** (CRDT).
* **Fabric.js** renders that document into an interactive canvas. Local Fabric mutations emit operations that update Liveblocks.
* **MongoDB** stores *project metadata* and *snapshots* (periodic autosave + on demand), enabling listing and reload.
* **Undo/Redo** uses **Liveblocks History** so it’s collaborative-aware.
* **Clerk** secures frontend + backend; backend issues **Liveblocks room tokens** per design with ACL checks.

---

## Data model

### Collaborative document (Liveblocks Storage)

```ts
// Liveblocks Storage shapes (CRDT-friendly, fabric-agnostic)
type BaseLayer = {
  id: string;                 // uuid
  kind: "rect" | "circle" | "image" | "text";
  x: number; y: number;
  width: number; height: number;
  rotation: number;           // degrees
  opacity: number;            // 0..1
  z: number;                  // derived from list index but kept for convenience
  name: string;               // layer rename
  locked: boolean;
  lastUpdatedBy?: string;     // userId
};

type TextLayer = BaseLayer & {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;               // color
  textAlign: "left" | "center" | "right";
};

type ShapeLayer = BaseLayer & {
  kind: "rect" | "circle";
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius?: number;            // circle
};

type ImageLayer = BaseLayer & {
  kind: "image";
  src: string;                // URL
  naturalWidth?: number;
  naturalHeight?: number;
};

type Comment = {
  id: string;
  layerId?: string;           // anchored to layer OR
  x?: number; y?: number;     // anchored to canvas coordinate
  text: string;
  mentions: string[];         // Clerk user IDs
  authorId: string;
  createdAt: number;          // Date.now()
  resolved: boolean;
};

type DesignDoc = {
  canvas: { width: number; height: number; background: string };
  layers: LiveList<TextLayer | ShapeLayer | ImageLayer>;
  comments: LiveList<Comment>;
};
```

**Presence (Liveblocks)**

```ts
type Presence = {
  cursor?: { x: number; y: number } | null;
  selection: string[];     // selected layer ids
  color: string;           // user cursor color
  name: string;            // from Clerk
  avatar: string;          // from Clerk
};
```

### Persistence (MongoDB)

```ts
// designs collection
{
  _id: ObjectId,
  name: string,
  ownerId: string,               // Clerk user id
  collaborators: string[],       // Clerk user ids
  roomId: string,                // Liveblocks room = design _id string
  lastSavedAt: Date,
  thumbnailUrl?: string,
  updatedAt: Date, createdAt: Date
}

// snapshots collection (latest + history optional)
{
  _id: ObjectId,
  designId: ObjectId,
  version: number,               // increments
  doc: DesignDocLike,            // serialized from Liveblocks doc
  createdAt: Date
}
```

---

## Frontend architecture

### State boundaries

* **Liveblocks Storage**: shared document (`layers`, `comments`, `canvas`, history).
* **Redux**: local UI only (tool mode, panels open, color pickers, modals, toasts).
* **React local state/refs**: Fabric canvas instance & imperative handles.

### Key components

```
/src
  /app
    store.ts
  /liveblocks
    client.ts                 // createClient, RoomProvider
  /auth
    ClerkProvider.tsx
  /canvas
    FabricCanvas.tsx          // Canvas rendering + event bridge
    useFabricBridge.ts        // Convert Liveblocks docs <-> Fabric objects
    converters.ts             // Layer <-> fabric.Object mappers
  /panels
    TopBar.tsx                // tools, undo/redo, export, name
    LeftLayers.tsx            // layer list (reorder/rename/delete)
    RightInspector.tsx        // styling of selected layer
    CommentsPanel.tsx         // threads with @mentions
  /features
    uiSlice.ts                // redux
    autosave.ts               // debounced snapshot push
  /api
    http.ts                   // fetch wrapper with Clerk token
```

### Fabric integration (bridge)

* On Liveblocks `layers` change: **reconcile** Fabric objects by id (create/update/remove without re-creating entire canvas).
* On Fabric events (`object:added|modified|removed|scaling|rotating|moving|selection:created|cleared`): apply **minimal Liveblocks ops** to the target layer(s).
* Avoid feedback loops by ignoring mutations where `layer.lastUpdatedBy === myUserId` for a short debounce window.

**FabricCanvas skeleton**

```tsx
// /canvas/FabricCanvas.tsx
import { fabric } from "fabric";
import { useRoom, useStorage, useUpdateMyPresence } from "@liveblocks/react";
import { useEffect, useRef } from "react";
import { toFabric, fromFabric } from "./converters";

export function FabricCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const doc = useStorage(root => root as any); // { canvas, layers, comments }
  const updatePresence = useUpdateMyPresence();

  // Init Fabric
  useEffect(() => {
    if (!canvasRef.current) return;
    const fc = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = fc;

    // Pointer move -> presence cursor
    fc.on("mouse:move", (e) => {
      const p = fc.getPointer(e.e);
      updatePresence({ cursor: { x: p.x, y: p.y } });
    });

    // Selection -> presence selection
    fc.on("selection:created", () => {
      updatePresence({ selection: (fc.getActiveObjects() || []).map(o => o.data?.id) });
    });
    fc.on("selection:cleared", () => updatePresence({ selection: [] }));

    // Object transforms -> Liveblocks ops
    const onModified = (e: fabric.IEvent) => {
      const obj = e.target as fabric.Object & { data?: { id: string } };
      if (!obj?.data?.id) return;
      const patch = fromFabric(obj);
      // apply patch through Liveblocks history so undo/redo works
      // example: room.history.undo/redo or storage updates within a batch
      fc?.requestRenderAll();
    };
    fc.on("object:modified", onModified);
    fc.on("object:moving", onModified);
    fc.on("object:scaling", onModified);
    fc.on("object:rotating", onModified);

    return () => { fc.dispose(); };
  }, []);

  // Reconcile from Liveblocks -> Fabric
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !doc) return;
    // minimal diff by id; create/update/remove
    // set z-order by layers LiveList order
    fc.requestRenderAll();
  }, [doc?.layers]);

  return (
    <canvas
      ref={canvasRef}
      width={doc?.canvas.width ?? 1080}
      height={doc?.canvas.height ?? 1080}
      style={{ background: doc?.canvas.background ?? "#ffffff" }}
    />
  );
}
```

**Converters (example for text)**

```ts
// /canvas/converters.ts
import { fabric } from "fabric";

export function toFabric(layer: any): fabric.Object {
  switch (layer.kind) {
    case "text": {
      const t = new fabric.Textbox(layer.text, {
        left: layer.x, top: layer.y,
        width: layer.width, angle: layer.rotation,
        fontFamily: layer.fontFamily, fontSize: layer.fontSize,
        fill: layer.fill, opacity: layer.opacity,
      }) as fabric.Textbox;
      (t as any).data = { id: layer.id };
      return t;
    }
    // rect, circle, image similarly...
  }
}

export function fromFabric(obj: any) {
  return {
    id: obj.data.id,
    x: obj.left, y: obj.top,
    width: obj.width * obj.scaleX,
    height: obj.height * obj.scaleY,
    rotation: obj.angle,
    opacity: obj.opacity,
    // text, fill, etc. based on obj.get('...') by kind
  };
}
```

### Undo/Redo (collaborative)

Use **Liveblocks History** (client-side):

```ts
import { useHistory } from "@liveblocks/react";

function TopBar() {
  const { undo, redo, canUndo, canRedo } = useHistory();
  return (
    <>
      <button disabled={!canUndo} onClick={undo}>Undo</button>
      <button disabled={!canRedo} onClick={redo}>Redo</button>
    </>
  );
}
```

### Comments with @mentions

* UI in a side panel; each comment references a `layerId` or coordinates.
* Mentions come from **Clerk** user list (org members) and resolved to Clerk user IDs.
* Comments stored in Liveblocks Storage (`comments` LiveList).
* On save/autosave, comments are included in the snapshot to Mongo.

### Export to PNG

* `fabricCanvas.toDataURL({ format: 'png', multiplier: 1 })` for **Download**.
* Generate thumbnail client-side at lower multiplier and POST to `/designs/:id/thumbnail`.

### Performance

* Reconcile objects by ID (never recreate canvas wholesale).
* Memoize inspectors; use `useSelector` with shallowEqual and derived selectors.
* Debounce autosave (e.g., 2–5s after last change).
* Avoid extra renders—Fabric mutates DOM; React should not manage object props directly.

---

## Realtime & auth

### Room model

* **Room ID** = `design._id.toString()`.
* Access control: allowed if `ownerId === userId` or userId in `collaborators`.

### Clerk ↔ Liveblocks auth

1. Frontend obtains Clerk session token automatically.
2. Frontend calls **backend** `/api/liveblocks/auth?roomId=...` with Bearer token.
3. Backend verifies Clerk JWT; checks ACL against Mongo; returns Liveblocks auth payload with user metadata (name/avatar/color).

**Backend route**

```ts
// /routes/liveblocks.ts
import { Router } from "express";
import { requireAuth } from "../util/auth";
import { liveblocks } from "../util/liveblocks";
import { z } from "zod";
import Design from "../models/Design";

const router = Router();

router.post("/auth", requireAuth, async (req, res, next) => {
  try {
    const { roomId } = z.object({ roomId: z.string().min(1) }).parse(req.body);
    const design = await Design.findById(roomId);
    if (!design) return res.status(404).json({ code: "NOT_FOUND", message: "Design not found" });

    const userId = req.auth.userId!;
    const canAccess = design.ownerId === userId || design.collaborators.includes(userId);
    if (!canAccess) return res.status(403).json({ code: "FORBIDDEN", message: "No access" });

    const userInfo = {
      userId,
      info: { name: req.auth.user?.fullName, avatar: req.auth.user?.imageUrl },
    };
    const result = await liveblocks.identifyUser(roomId, userInfo);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
```

**Frontend Liveblocks client**

```ts
// /liveblocks/client.ts
import { createClient } from "@liveblocks/client";

export const liveblocksClient = createClient({
  authEndpoint: async (room) => {
    const res = await fetch("/api/liveblocks/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room }),
      credentials: "include",
    });
    return await res.json();
  },
});
```

---

## Backend (Express + Mongo + Zod)

**Directory**

```
/server
  index.ts
  /routes
    designs.ts
    liveblocks.ts
  /models
    Design.ts        // Mongoose
    Snapshot.ts
  /middleware
    error.ts         // {code,message,details}
  /util
    auth.ts          // Clerk verify
    liveblocks.ts    // SDK client
    z.ts             // shared zod schemas
```

**Mongoose models (essential)**

```ts
// /models/Design.ts
import { Schema, model } from "mongoose";
const DesignSchema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  collaborators: [String],
  roomId: { type: String, required: true, unique: true },
  thumbnailUrl: String,
}, { timestamps: true });

export default model("Design", DesignSchema);

// /models/Snapshot.ts
const SnapshotSchema = new Schema({
  designId: { type: Schema.Types.ObjectId, ref: "Design", index: true },
  version: { type: Number, required: true },
  doc: { type: Schema.Types.Mixed, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model("Snapshot", SnapshotSchema);
```

**Zod request schemas**

```ts
// /util/z.ts
import { z } from "zod";

export const zCreateDesign = z.object({
  name: z.string().min(1),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1080),
});

export const zSaveSnapshot = z.object({
  version: z.number().int().nonnegative(),
  doc: z.any(), // could refine types if time allows
  thumbnailDataUrl: z.string().optional(),
});
```

**Designs routes**

```ts
// /routes/designs.ts
import { Router } from "express";
import { zCreateDesign, zSaveSnapshot } from "../util/z";
import { requireAuth } from "../util/auth";
import Design from "../models/Design";
import Snapshot from "../models/Snapshot";

const r = Router();
r.use(requireAuth);

// Create design
r.post("/", async (req, res, next) => {
  try {
    const { name, width, height } = zCreateDesign.parse(req.body);
    const ownerId = req.auth.userId!;
    const design = await Design.create({
      name, ownerId, collaborators: [], roomId: "", thumbnailUrl: undefined
    });
    design.roomId = design._id.toString();
    await design.save();
    // initial snapshot doc with empty layers/comments
    await Snapshot.create({
      designId: design._id, version: 0,
      doc: { canvas: { width, height, background: "#fff" }, layers: [], comments: [] }
    });
    res.status(201).json({ id: design.id, roomId: design.roomId, name: design.name });
  } catch (e) { next(e); }
});

// List designs for user
r.get("/", async (req, res, next) => {
  try {
    const userId = req.auth.userId!;
    const items = await Design.find({ $or: [{ ownerId: userId }, { collaborators: userId }] })
      .sort({ updatedAt: -1 })
      .select("name updatedAt thumbnailUrl");
    res.json(items);
  } catch (e) { next(e); }
});

// Get latest snapshot (for initial room seed)
r.get("/:id/snapshot", async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) return res.status(404).json({ code: "NOT_FOUND", message: "Design not found" });
    // ACL omitted for brevity—same as auth route
    const latest = await Snapshot.findOne({ designId: design._id }).sort({ version: -1 });
    res.json({ version: latest?.version ?? 0, doc: latest?.doc });
  } catch (e) { next(e); }
});

// Save snapshot (+ optional thumbnail)
r.post("/:id/snapshot", async (req, res, next) => {
  try {
    const body = zSaveSnapshot.parse(req.body);
    const design = await Design.findById(req.params.id);
    if (!design) return res.status(404).json({ code: "NOT_FOUND", message: "Design not found" });
    // ACL checks...
    const latest = await Snapshot.findOne({ designId: design._id }).sort({ version: -1 });
    const nextVersion = (latest?.version ?? 0) + 1;
    await Snapshot.create({ designId: design._id, version: nextVersion, doc: body.doc });
    design.lastSavedAt = new Date();
    // optional: store thumbnailDataUrl to S3 and set design.thumbnailUrl
    await design.save();
    res.status(201).json({ version: nextVersion });
  } catch (e) { next(e); }
});

export default r;
```

**Error middleware (structured)**

```ts
// /middleware/error.ts
export function errorHandler(err, req, res, next) {
  if (err.name === "ZodError") {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid payload", details: err.errors });
  }
  const status = err.status || 500;
  res.status(status).json({ code: err.code || "INTERNAL", message: err.message || "Unexpected error" });
}
```

---

## App flows

1. **Auth & list**

   * User signs in via **Clerk**.
   * `/api/designs` returns designs with thumbnails/updatedAt.

2. **Open design**

   * Fetch latest snapshot `/designs/:id/snapshot` for initial *client state*.
   * Join **Liveblocks room** with `/liveblocks/auth`.
   * Seed Liveblocks Storage if empty (first editor) or rely on current room state.

3. **Edit**

   * Add/edit/transform layers in Fabric; bridge updates Liveblocks.
   * Other users see immediate updates; presence shows cursors and selections.

4. **Comments**

   * Add thread on layer or point; parse `@` to mention; store in `comments` LiveList.

5. **Undo/Redo**

   * Per-user undo/redo using **Liveblocks History**.

6. **Save/Autosave**

   * Debounced: serialize Liveblocks doc and POST `/designs/:id/snapshot`.
   * Also upload generated thumbnail (optional).

7. **Export**

   * `toDataURL('png')` → client download.

---

## UI mapping (suggested layout)

* **Top bar:** text / image(url) / shape(rect,circle), undo/redo, download, project name (editable).
* **Left panel:** layers list = LiveList order; drag to reorder (updates LiveList); rename; delete.
* **Right panel:** Inspector bound to selected layer type:

  * Text: font family, size, color
  * Shape: fill, stroke, strokeWidth
  * Image: replace URL, opacity
  * All: position (x,y), rotation, lock, opacity
* **Canvas:** Fabric with bounding boxes, handles, snapping (nice-to-have).

---

## Nice-to-haves (how)

* **Snapping/guides:** Use Fabric’s `perPixelTargetFind=false` + custom guides on `object:moving` (snap to canvas edges/centers and other objects within tolerance).
* **Autosave:** `useDebouncedCallback` 2–5s on any Liveblocks storage change; surface toast “All changes saved”.
* **Keyboard shortcuts:** `Cmd/Ctrl+Z/Y, Delete, arrows, Cmd/Ctrl+C/V` using a single `useHotkeys` hook and Fabric APIs.
* **Simple auth & per-user projects:** already covered via Clerk + ACL fields.
* **Thumbnail endpoint:** accept `data:image/png;base64,...`, store to S3/Cloudinary; persist URL on design.
* **CI:** yarn lint, typecheck, tests; run mongodb memory server for API tests.

---

## Testing

**Unit**

* Converters (layer ↔ fabric) round-trip.
* Redux UI slice reducers.
* Zod validators.
* Express routes with supertest (create/list/snapshot ACL).

**E2E (Playwright)**

* Two browser contexts load same design; edits from A appear in B; undo on A reverts A’s own last op.
* Comment with @mention renders mention chip and persists after reload.
* Export triggers PNG download.

---

## 48-hour build plan (aggressive)

**Day 1**

* Scaffold backend (Express, Clerk verify, Mongoose, Zod, errors).
* Models & routes: create/list/snapshot + liveblocks auth.
* Frontend app shell with Clerk, RoomProvider, Redux.
* Fabric canvas wrapper + add rect/text/image; selection & transform.

**Day 2**

* Liveblocks storage mapping + history + presence.
* Layers panel (reorder/rename/delete).
* Inspector for per-type styling.
* Comments panel with @mention UI.
* Autosave + thumbnail.
* Export PNG; toasts; basic tests; Playwright happy path.

---

## Security & perf notes

* Validate all inputs with Zod; sanitize image URLs (allowlist schemes).
* Enforce ACL on all endpoints; room token only for authorized users.
* Paginate `GET /designs`; index `designId` on snapshots.
* Avoid large Storage payloads by normalizing layers; images remain external URLs.
* Compress thumbnails; debounce network chatter.

---

## “Cite AI/codegen assistance”

Portions of this architecture and example code were drafted with assistance from **GPT-5 Thinking**.

---

### Appendix: minimal Redux slice (UI)

```ts
// /features/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UIState = {
  activeTool: "select" | "text" | "rect" | "circle" | "image";
  rightPanelOpen: boolean;
  leftPanelOpen: boolean;
  toast?: { type: "success" | "error"; message: string } | null;
};
const initial: UIState = { activeTool: "select", rightPanelOpen: true, leftPanelOpen: true, toast: null };

export const uiSlice = createSlice({
  name: "ui",
  initialState: initial,
  reducers: {
    setTool: (s, a: PayloadAction<UIState["activeTool"]>) => { s.activeTool = a.payload; },
    showToast: (s, a: PayloadAction<UIState["toast"]>) => { s.toast = a.payload; },
    clearToast: (s) => { s.toast = null; },
  }
});
export const { setTool, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
```

### Appendix: Debounced autosave hook

```ts
// /features/autosave.ts
import { useEffect } from "react";
import { useSelf, useStorage } from "@liveblocks/react";

export function useAutosave(designId: string) {
  const doc = useStorage(root => root);
  const me = useSelf();
  useEffect(() => {
    if (!doc) return;
    const handle = setTimeout(async () => {
      const payload = { version: Date.now(), doc }; // versioning simplified
      await fetch(`/api/designs/${designId}/snapshot`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), credentials: "include"
      });
    }, 2500);
    return () => clearTimeout(handle);
  }, [doc, me?.id, designId]);
}
```

---

If you want, I can tailor this to your preferred folder names, or swap any element (e.g., Konva instead of Fabric) without changing the overall design.
