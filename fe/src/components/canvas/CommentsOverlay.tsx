import { useThreads } from "../../../liveblocks.config";
import PinnedThread from "./PinnedThread";

export default function CommentsOverlay() {
  const { threads } = useThreads();

  return (
    <>
      {threads?.map((thread) => (
        <PinnedThread key={thread.id} thread={thread} />
      ))}
    </>
  );
}
