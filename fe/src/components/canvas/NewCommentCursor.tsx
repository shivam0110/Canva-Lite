import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";

interface NewCommentCursorProps {
  display: boolean;
}

export default function NewCommentCursor({ display }: NewCommentCursorProps) {
  const [coords, setCoords] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    if (display) {
      document.documentElement.classList.add("cursor-none");
      window.addEventListener("mousemove", updatePosition);
    } else {
      document.documentElement.classList.remove("cursor-none");
    }

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.documentElement.classList.remove("cursor-none");
    };
  }, [display]);

  if (!display) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
        <MessageSquarePlus className="h-5 w-5" />
      </div>
    </div>
  );
}
