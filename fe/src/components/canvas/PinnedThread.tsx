import { useState, useEffect } from "react";
import { Thread } from "@liveblocks/react-ui";
import { type ThreadData } from "@liveblocks/client";
import { MessageSquare, Trash2, Check } from "lucide-react";
import {
  useEditThreadMetadata,
  useDeleteComment,
} from "../../../liveblocks.config";

interface PinnedThreadProps {
  thread: ThreadData;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function PinnedThread({ thread, canvasRef }: PinnedThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });
  const editThreadMetadata = useEditThreadMetadata();
  const deleteComment = useDeleteComment();

  // Get position from thread metadata (if available)
  const metadata = thread.metadata as {
    x?: number;
    y?: number;
    resolved?: boolean;
  };

  const x = metadata?.x ?? 100;
  const y = metadata?.y ?? 100;

  // Calculate screen position from canvas-relative coordinates
  useEffect(() => {
    const updatePosition = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setScreenPosition({
          x: rect.left + x,
          y: rect.top + y,
        });
      }
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [x, y, canvasRef]);

  if (metadata?.resolved) {
    return null;
  }

  const handleResolveThread = () => {
    editThreadMetadata({
      threadId: thread.id,
      metadata: {
        ...metadata,
        resolved: true,
      },
    });
  };

  const handleDeleteThread = () => {
    // Delete all comments in the thread
    thread.comments.forEach((comment) => {
      deleteComment({ threadId: thread.id, commentId: comment.id });
    });
  };

  return (
    <div
      className="fixed"
      style={{
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        transform: "translate(-50%, -100%)",
        zIndex: 9999,
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Comment Icon */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
          title={`${thread.comments.length} comment${
            thread.comments.length === 1 ? "" : "s"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          {thread.comments.length > 1 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
              {thread.comments.length}
            </span>
          )}
        </button>

        {/* Thread Panel */}
        {expanded && (
          <div className="w-80 max-h-96 overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200">
            {/* Thread Actions */}
            <div className="flex items-center justify-end gap-2 p-2 border-b border-gray-200 bg-gray-50">
              <button
                onClick={handleResolveThread}
                className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Resolve thread"
              >
                <Check className="h-3 w-3" />
                Resolve
              </button>
              <button
                onClick={handleDeleteThread}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete thread"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>

            {/* Thread Comments */}
            <Thread
              thread={thread}
              className="p-4"
              indentCommentContent={false}
              showActions={true}
              showReactions={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
