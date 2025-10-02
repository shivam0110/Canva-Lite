# Canva Lite

A collaborative canvas-based design editor with real-time collaboration, built as a simplified alternative to Canva. Users can create designs with text, shapes, and images, collaborate in real-time, and export their work.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Library Choices](#library-choices)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [What Was Cut and Why](#what-was-cut-and-why)
- [Getting Started](#getting-started)
- [Testing](#testing)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + TypeScript + Redux + Fabric.js + Liveblocks       │
└──────────┬─────────────────────────────────┬────────────────┘
           │ HTTP (REST API)                 │ WebSocket
           │                                 │ (Real-time)
           ▼                                 ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│         Backend          │      │   Liveblocks Cloud       │
│  Node.js + Express       │      │   (WebSocket Server)     │
│  + MongoDB               │      │                          │
└──────────┬───────────────┘      │  • Presence/Cursors      │
           │                      │  • Canvas Sync (CRDT)    │
           ▼                      │  • Comments/Threads      │
      ┌─────────┐                 │  • History               │
      │ MongoDB │                 └──────────────────────────┘
      └─────────┘

Note: Backend only provides HTTP REST API + Liveblocks auth.
      No direct WebSocket between FE ↔ BE.
```

### Data Flow

1. **Persistence Layer (MongoDB)**: Stores design metadata (title, dimensions, userId) and canvas elements as snapshots
2. **Real-time Layer (Liveblocks)**: Manages live collaboration via **WebSocket** including:
   - User presence (cursors, selections)
   - Canvas element synchronization (CRDT-based)
   - Threaded comments with @mentions
   - Collaborative history
3. **Canvas Rendering (Fabric.js)**: Handles visual rendering and user interactions with canvas elements
4. **State Management (Redux)**: Manages local UI state (selected elements, history, comments mode)
5. **Backend API (HTTP REST)**: Provides CRUD endpoints, auth gateway for Liveblocks, and export functionality

**Important**: The backend is a **pure HTTP REST API** (no WebSocket). All real-time features use Liveblocks' WebSocket infrastructure.

### Key Design Decisions

**Hybrid Storage Model**: The application uses a hybrid approach where:

- **Liveblocks Storage** holds the real-time collaborative state (stringified canvas elements)
- **MongoDB** stores persistent design metadata and periodic snapshots
- This allows seamless real-time collaboration while maintaining persistence

**Fabric.js Integration**: Fabric.js provides:

- Rich canvas manipulation APIs
- Built-in transformation handles (resize, rotate)
- Event-driven architecture for user interactions
- Cross-browser canvas rendering

**Zod Validation**: Runtime validation ensures data integrity at API boundaries, protecting against malformed data from clients.

**shadcn/ui for Consistent UI**: The application uses [shadcn/ui](https://ui.shadcn.com/) components for a polished, accessible interface:

- Built on Radix UI primitives (WAI-ARIA compliant)
- Styled with Tailwind CSS using the "New York" design style
- Components are copied into the project (`components/ui/`) for full customization
- Provides buttons, dialogs, forms, inputs, cards, and more
- Consistent design system across all UI elements

---

## Library Choices

### Frontend

| Library             | Purpose                 | Why Chosen                                                                    |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| **React 19**        | UI Framework            | Industry standard, component-based architecture, excellent ecosystem          |
| **TypeScript**      | Type Safety             | Catch errors at compile time, better IDE support, self-documenting code       |
| **Redux Toolkit**   | Local State Management  | Predictable state updates, time-travel debugging, Redux DevTools              |
| **Fabric.js 6.7**   | Canvas Rendering        | Powerful canvas library with object manipulation, events, and transformations |
| **Liveblocks**      | Real-time Collaboration | Purpose-built for collaboration with presence, storage, comments, and history |
| **Clerk**           | Authentication          | Complete auth solution with session management and user APIs                  |
| **React Router**    | Routing                 | Standard routing solution for React SPAs                                      |
| **React Hook Form** | Form Management         | Performant forms with minimal re-renders                                      |
| **shadcn/ui**       | UI Component Library    | Copy-paste components built on Radix UI + Tailwind, fully customizable        |
| **Radix UI**        | UI Primitives           | Accessible, unstyled components (foundation for shadcn/ui)                    |
| **Tailwind CSS**    | Styling                 | Utility-first CSS, rapid development, consistent design                       |
| **Lucide React**    | Icons                   | Beautiful, consistent icon set                                                |
| **Vitest**          | Testing                 | Fast, Vite-native testing with Jest-compatible API                            |
| **Playwright**      | E2E Testing             | Reliable cross-browser testing                                                |

### Backend

| Library                   | Purpose               | Why Chosen                                                        |
| ------------------------- | --------------------- | ----------------------------------------------------------------- |
| **Node.js + Express**     | Server Framework      | Fast, minimal, widely adopted for REST APIs                       |
| **MongoDB + Mongoose**    | Database              | Flexible schema, good for evolving data models, ODM for structure |
| **Zod**                   | Runtime Validation    | Schema validation with TypeScript inference, catches invalid data |
| **@liveblocks/node**      | Liveblocks SDK        | Server-side auth for Liveblocks rooms                             |
| **@clerk/clerk-sdk-node** | Auth Verification     | Verify JWT tokens, fetch user data                                |
| **canvas (node-canvas)**  | Server-side Rendering | Generate PNG exports server-side                                  |
| **Jest + Supertest**      | Testing               | Industry standard for Node.js testing                             |

---

## API Documentation

Base URL: `http://localhost:3000/api`

### Designs API

#### `POST /designs`

Create a new design.

**Request Body:**

```json
{
  "title": "My Design",
  "width": 800,
  "height": 600,
  "userId": "clerk_user_id",
  "canvasElements": [],
  "liveblocksRoom": "design-{id}"
}
```

**Response:** `201 Created`

```json
{
  "id": "65f...",
  "title": "My Design",
  "width": 800,
  "height": 600,
  "userId": "clerk_user_id",
  "thumbnail": null,
  "canvasElements": [],
  "liveblocksRoom": "design-65f...",
  "createdAt": "2025-10-02T...",
  "updatedAt": "2025-10-02T..."
}
```

#### `GET /designs/user/:userId`

Get all designs for a user.

**Response:** `200 OK`

```json
[
  {
    "id": "65f...",
    "title": "My Design",
    "width": 800,
    "height": 600,
    "userId": "clerk_user_id",
    "thumbnail": "https://...",
    "createdAt": "2025-10-02T...",
    "updatedAt": "2025-10-02T..."
  }
]
```

#### `GET /designs/:id`

Get a single design by ID.

**Response:** `200 OK`

```json
{
  "id": "65f...",
  "title": "My Design",
  "width": 800,
  "height": 600,
  "userId": "clerk_user_id",
  "thumbnail": "https://...",
  "canvasElements": [...],
  "liveblocksRoom": "design-65f...",
  "createdAt": "2025-10-02T...",
  "updatedAt": "2025-10-02T..."
}
```

#### `PUT /designs/:id`

Update a design.

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Title",
  "thumbnail": "data:image/png;base64,...",
  "canvasElements": [...]
}
```

**Response:** `200 OK` (same as GET)

#### `POST /designs/:id/export`

Export design as PNG.

**Request Body:**

```json
{
  "canvasElements": [
    {
      "id": "uuid",
      "type": "text",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Hello",
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000"
    }
  ]
}
```

**Response:** `200 OK`

- Content-Type: `image/png`
- Content-Disposition: `attachment; filename="my_design.png"`
- Body: PNG binary data

#### `DELETE /designs/:id`

Delete a design.

**Response:** `200 OK`

```json
{
  "message": "Design deleted successfully",
  "id": "65f..."
}
```

### Liveblocks API

#### `POST /liveblocks/auth`

Authenticate user for Liveblocks room access.

**Headers:**

```
Authorization: Bearer <clerk_jwt_token>
```

**Request Body:**

```json
{
  "room": "design-65f..."
}
```

**Response:** `200 OK`

```json
{
  "token": "liveblocks_token...",
  "actor": 0
}
```

**Authentication Flow:**

1. Frontend obtains Clerk session token
2. Calls this endpoint with room ID and Bearer token (HTTP POST)
3. Backend verifies Clerk JWT, assigns user color
4. Returns Liveblocks session token with user metadata
5. Frontend uses token to establish **WebSocket connection to Liveblocks servers** (not to backend)
6. Real-time collaboration active via Liveblocks WebSocket

**Note**: The backend does NOT handle WebSocket connections. It only provides HTTP auth to generate Liveblocks tokens.

### Users API

#### `POST /users/batch`

Get multiple users by their IDs (for resolving presence).

**Request Body:**

```json
{
  "userIds": ["clerk_user_1", "clerk_user_2"]
}
```

**Response:** `200 OK`

```json
[
  {
    "id": "clerk_user_1",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "imageUrl": "https://..."
  }
]
```

#### `GET /users/search?q=john`

Search users for @mentions.

**Query Parameters:**

- `q` (optional): Search query

**Response:** `200 OK`

```json
[
  {
    "id": "clerk_user_1",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "imageUrl": "https://..."
  }
]
```

---

## Database Schema

### Collections

#### `users`

Stores user profile information from Clerk.

```javascript
{
  _id: ObjectId,
  clerkId: String,        // Unique Clerk user ID (indexed)
  email: String,          // Unique email
  firstName: String,
  lastName: String,
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `clerkId` (unique)
- `email` (unique)

**Zod Schema:**

```typescript
{
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  imageUrl: z.string().url().optional()
}
```

#### `designs`

Stores design metadata and canvas snapshots.

```javascript
{
  _id: ObjectId,
  title: String,          // Design name
  width: Number,          // Canvas width in pixels
  height: Number,         // Canvas height in pixels
  userId: String,         // Clerk user ID (indexed)
  thumbnail: String,      // Thumbnail URL or data URI
  canvasElements: [       // Array of canvas elements
    {
      id: String,
      type: "text" | "image" | "shape",
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      zIndex: Number,
      name: String,
      // Type-specific fields...
    }
  ],
  liveblocksRoom: String, // Unique Liveblocks room ID (sparse index)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `userId` + `createdAt` (compound, for efficient user queries)
- `liveblocksRoom` (unique, sparse)

**Zod Schema:**

```typescript
{
  title: z.string().min(1).max(100),
  width: z.number().positive(),
  height: z.number().positive(),
  userId: z.string().min(1),
  thumbnail: z.string().optional(),
  canvasElements: z.array(canvasElementSchema).default([]),
  liveblocksRoom: z.string().optional()
}
```

**Canvas Element Schema:**

```typescript
{
  id: z.string(),
  type: z.enum(["text", "image", "shape"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number()
  // ... additional type-specific properties allowed via .passthrough()
}
```

---

### Not implemented

1. **No Keyboard Shortcuts** - Full hotkey system (Cmd+Z/Y, arrows, copy/paste) not implemented.
2. **No Design Sharing** - Designs are currently public. No sharing/collaboration invitation system.
3. **Image Import Missing** - Forgot to implement image upload functionality.
4. **No E2E Tests**

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB running locally or MongoDB Atlas connection
- Clerk account (free tier works)
- Liveblocks account (free tier works)

### Environment Variables

Create `.env` files based on `.env.local`:

### Installation

```bash
# Install all dependencies (root + workspaces)
npm run install:all

# Or manually
npm install
cd fe && npm install
cd ../be && npm install
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev --workspace=fe  # Frontend on :5173
npm run dev --workspace=be  # Backend on :3000
```

### Testing

```bash
# Run all tests
npm test

# Frontend tests only (Vitest)
npm run test --workspace=fe
npm run test:ui --workspace=fe     # UI mode
npm run test:coverage --workspace=fe

# Backend tests only (Jest)
npm run test --workspace=be
npm run test:watch --workspace=be
npm run test:coverage --workspace=be
```

### Project Structure

```
canva-lite/
├── fe/                        # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── actions/          # Async actions (API calls)
│   │   ├── components/       # React components
│   │   │   ├── canvas/       # Canvas editor components
│   │   │   ├── designs/      # Design list components
│   │   │   └── ui/           # shadcn/ui components (Button, Dialog, Input, etc.)
│   │   ├── pages/            # Route pages
│   │   ├── reducers/         # Redux slices
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utilities (including shadcn utils)
│   │   └── main.tsx          # Entry point
│   ├── components.json       # shadcn/ui configuration
│   ├── liveblocks.config.ts  # Liveblocks setup
│   └── vitest.config.ts      # Test config
│
├── be/                        # Backend (Node.js + Express)
│   ├── models/               # Mongoose schemas
│   │   ├── Design.js        # Design model + Zod schema
│   │   └── User.js          # User model + Zod schema
│   ├── routes/               # Express routes
│   │   ├── designs.js       # CRUD + export
│   │   ├── liveblocks.js    # Auth endpoint
│   │   └── users.js         # User queries
│   ├── tests/                # Jest tests
│   ├── server.js             # Express server
│   └── db.js                 # MongoDB connection
│
├── package.json               # Workspace root
└── README.md                  # This file
```
