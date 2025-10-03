import { useThreads } from "../../../liveblocks.config";
import PinnedThread from "./PinnedThread";

interface CommentsOverlayProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function CommentsOverlay({ canvasRef }: CommentsOverlayProps) {
  const { threads } = useThreads();

  return (
    <>
      {threads?.map((thread) => (
        <PinnedThread key={thread.id} thread={thread} canvasRef={canvasRef} />
      ))}
    </>
  );
}
