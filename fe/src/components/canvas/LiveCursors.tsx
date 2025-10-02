import { useEffect } from "react";
import { useOthers, useUpdateMyPresence } from "../../../liveblocks.config";
import { MousePointer2 } from "lucide-react";

const COLORS = [
  "#DC2626", // red
  "#D97706", // amber
  "#059669", // emerald
  "#2563EB", // blue
  "#7C3AED", // violet
  "#DB2777", // pink
];

interface CursorProps {
  color: string;
  x: number;
  y: number;
  name: string;
}

function Cursor({ color, x, y, name }: CursorProps) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-50"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <MousePointer2 className="h-6 w-6" style={{ color, fill: color }} />
      <div
        className="absolute left-6 top-6 rounded-md px-2 py-1 text-xs font-semibold text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
}

export default function LiveCursors() {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      updateMyPresence({
        cursor: {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
        },
      });
    };

    const handleMouseLeave = () => {
      updateMyPresence({ cursor: null });
    };

    window.addEventListener("mousemove", updateCursor);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [updateMyPresence]);

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor) return null;

        return (
          <Cursor
            key={connectionId}
            color={info?.color || COLORS[connectionId % COLORS.length]}
            x={presence.cursor.x}
            y={presence.cursor.y}
            name={info?.name || `User ${connectionId}`}
          />
        );
      })}
    </>
  );
}
