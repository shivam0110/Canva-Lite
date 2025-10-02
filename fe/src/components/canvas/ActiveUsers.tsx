import { useOthers, useSelf } from "../../../liveblocks.config";

const COLORS = [
  "#DC2626", // red
  "#D97706", // amber
  "#059669", // emerald
  "#2563EB", // blue
  "#7C3AED", // violet
  "#DB2777", // pink
];

interface AvatarProps {
  name: string;
  color: string;
}

function Avatar({ name, color }: AvatarProps) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md"
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ActiveUsers() {
  const others = useOthers();
  const currentUser = useSelf();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-white p-2 shadow-md">
      {/* Current user */}
      {currentUser && (
        <Avatar
          name={currentUser.info?.name || "You"}
          color={currentUser.info?.color || COLORS[0]}
        />
      )}

      {/* Other users */}
      {others.slice(0, 3).map(({ connectionId, info }) => (
        <Avatar
          key={connectionId}
          name={info?.name || `User ${connectionId}`}
          color={info?.color || COLORS[connectionId % COLORS.length]}
        />
      ))}

      {/* Show count if more than 3 other users */}
      {others.length > 3 && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
          +{others.length - 3}
        </div>
      )}
    </div>
  );
}
