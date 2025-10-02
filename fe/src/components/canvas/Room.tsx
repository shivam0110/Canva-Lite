import { type ReactNode, useEffect, useRef, useCallback } from "react";
import {
  RoomProvider,
  useStorage,
  useMutation,
} from "../../../liveblocks.config";
import { useDispatch, useSelector } from "react-redux";
import { ClientSideSuspense } from "@liveblocks/react";
import { setElements, setSyncStatus } from "../../reducers/canvasSlice";
import { type RootState } from "../../store";
import { type CanvasElement } from "../../types/canvas";
import { autosaveDesign } from "../../actions/designsActions";
import { debounce } from "../../lib/debounce";
import LiveCursors from "./LiveCursors";

interface RoomProps {
  roomId: string;
  children: ReactNode;
  designId?: string;
}

/**
 * Room component
 * Wraps the children components in a RoomProvider and a ClientSideSuspense
 * @param roomId - The ID of the room (also serves as the design ID)
 * @param children - The children components
 * @param designId - Optional design ID (if different from roomId)
 * @returns The Room component
 */
function Room({ roomId, children, designId }: RoomProps) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selectedElementId: null,
      }}
      initialStorage={{
        canvasElements: "[]",
      }}
    >
      <ClientSideSuspense fallback={<RoomLoading />}>
        {() => (
          <CollaborativeRoom roomId={roomId} designId={designId}>
            {children}
          </CollaborativeRoom>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

function CollaborativeRoom({
  children,
  roomId,
  designId,
}: {
  children: ReactNode;
  roomId: string;
  designId?: string;
}) {
  const dispatch = useDispatch();
  const localElements = useSelector(
    (state: RootState) => state.canvas.elements
  );
  const isSyncing = useRef(false);
  const lastStorageValue = useRef<string>("");
  const autosaveInProgress = useRef(false);

  // Read canvas elements from Liveblocks Storage
  const storageElements = useStorage((root) => root.canvasElements);

  // Debounced autosave function (2 seconds delay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedAutosave = useCallback(
    debounce(async (id: string, elements: CanvasElement[], room: string) => {
      if (autosaveInProgress.current) return;

      try {
        autosaveInProgress.current = true;
        await autosaveDesign(id, elements, room);
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        autosaveInProgress.current = false;
      }
    }, 2000),
    []
  );

  // Update Liveblocks Storage when local Redux state changes
  const updateStorage = useMutation(
    ({ storage }, elements: CanvasElement[]) => {
      const elementsJson = JSON.stringify(elements);
      storage.set("canvasElements", elementsJson);
      lastStorageValue.current = elementsJson;
    },
    []
  );

  // Sync from Liveblocks Storage to Redux (when remote users make changes)
  useEffect(() => {
    if (!storageElements || isSyncing.current) return;

    // Skip if this is our own update
    if (storageElements === lastStorageValue.current) return;

    // Skip initial empty storage - let Redux elements be the source of truth on first load
    if (storageElements === "[]" && localElements.length > 0) {
      updateStorage(localElements);
      return;
    }

    try {
      const elements: CanvasElement[] = JSON.parse(storageElements);
      isSyncing.current = true;
      lastStorageValue.current = storageElements;
      dispatch(setElements(elements));

      setTimeout(() => {
        isSyncing.current = false;
      }, 50);
    } catch (error) {
      console.error("Failed to parse storage elements:", error);
    }
  }, [storageElements, dispatch, localElements, updateStorage]);

  // Sync from Redux to Liveblocks Storage (when local user makes changes)
  useEffect(() => {
    if (isSyncing.current) return;

    const elementsJson = JSON.stringify(localElements);

    // Only update storage if it's actually different
    if (lastStorageValue.current !== elementsJson) {
      updateStorage(localElements);

      // Trigger autosave to backend if designId is provided
      const idToSave = designId || roomId;
      if (idToSave && localElements.length >= 0) {
        debouncedAutosave(idToSave, localElements, roomId);
      }
    }
  }, [localElements, updateStorage, debouncedAutosave, roomId, designId]);

  useEffect(() => {
    dispatch(setSyncStatus(true));

    return () => {
      dispatch(setSyncStatus(false));
    };
  }, [dispatch]);

  return (
    <>
      <LiveCursors />
      {children}
    </>
  );
}

function RoomLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        <p className="text-gray-600">Connecting to collaborative room...</p>
      </div>
    </div>
  );
}

export default Room;
