import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

interface ClerkUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  imageUrl?: string;
}

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string>;
      };
    };
  }
}

const API_URL = import.meta.env.VITE_API_URL;

const client = createClient({
  authEndpoint: async (room) => {
    // Get Clerk session token
    const clerkToken = await window.Clerk?.session?.getToken();

    const response = await fetch(`${API_URL}/api/liveblocks/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clerkToken && { Authorization: `Bearer ${clerkToken}` }),
      },
      body: JSON.stringify({ room }),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Liveblocks");
    }

    return response.json();
  },
  throttle: 16,
  resolveUsers: async ({ userIds }) => {
    // Fetch real user data from Clerk
    try {
      const response = await fetch(`${API_URL}/api/users/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        console.error("Failed to fetch users");
        return userIds.map((id) => ({ name: id, avatar: undefined }));
      }

      const users: ClerkUser[] = await response.json();
      return users.map((user) => ({
        name: user.firstName || user.username || user.id,
        avatar: user.imageUrl,
      }));
    } catch (error) {
      console.error("Error resolving users:", error);
      return userIds.map((id) => ({ name: id, avatar: undefined }));
    }
  },
  resolveMentionSuggestions: async ({ text }) => {
    // Fetch real users from Clerk for @mentions
    try {
      const query = text ? `?q=${encodeURIComponent(text)}` : "";
      const response = await fetch(`${API_URL}/api/users/search${query}`);

      if (!response.ok) {
        console.error("Failed to fetch mention suggestions");
        return [];
      }

      const users: ClerkUser[] = await response.json();
      return users.map((user) => user.id);
    } catch (error) {
      console.error("Error fetching mention suggestions:", error);
      return [];
    }
  },
});

// Presence represents the properties that exist on every user in the Room
// and that will automatically be kept in sync. Accessible through the
// `user.presence` property. Must be JSON-serializable.
type Presence = {
  cursor: { x: number; y: number } | null;
  selectedElementId: string | null;
};

// Storage represents the shared document that persists in the
// Room, even after all users leave. We store canvas elements here
// for real-time collaboration
type Storage = {
  canvasElements: string; // JSON stringified CanvasElement[]
};

// Optionally, UserMeta represents static/readonly metadata on each user, as
// provided by your own custom auth back end (if used). Useful for data that
// will not change during a session, like a user's name or avatar.
type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar?: string;
    color: string;
  };
};

// Custom events (kept for potential future use, but canvas now uses Storage)
type RoomEvent = {
  type: "PING";
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStatus,
    useLostConnectionListener,
    useThreads,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
