import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { type RootState } from "../../store";
import {
  selectElement,
  deleteElement,
  bringForward,
  sendBackward,
  updateElement,
  reorderLayer,
} from "../../reducers/canvasSlice";
import { type CanvasElement } from "../../types/canvas";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Layers,
  GripVertical,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function LayersPanel() {
  const dispatch = useDispatch();
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const selectedElementId = useSelector(
    (state: RootState) => state.canvas.selectedElementId
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleSelectLayer = (id: string) => {
    dispatch(selectElement(id));
  };

  const handleDeleteLayer = (id: string) => {
    dispatch(deleteElement(id));
  };

  const handleBringForward = (id: string) => {
    dispatch(bringForward(id));
  };

  const handleSendBackward = (id: string) => {
    dispatch(sendBackward(id));
  };

  const startRenaming = (element: CanvasElement) => {
    setEditingId(element.id);
    setEditName(element.name);
  };

  const finishRenaming = () => {
    if (editingId && editName.trim()) {
      dispatch(
        updateElement({ id: editingId, updates: { name: editName.trim() } })
      );
    }
    setEditingId(null);
    setEditName("");
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case "text":
        return "📝";
      case "image":
        return "🖼️";
      case "shape":
        return "⬛";
      default:
        return "📦";
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      dispatch(reorderLayer({ draggedId, targetId }));
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div
      className={`h-full bg-gray-50 border-r border-gray-200 overflow-y-auto transition-all ${
        isCollapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Layers size={18} />
            <h3 className="text-sm font-semibold text-gray-700">Layers</h3>
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-6 w-6 p-0 hover:bg-gray-200 ml-auto"
          title={isCollapsed ? "Expand Layers Panel" : "Collapse Layers Panel"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4">
          {elements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-8">
              No layers yet
            </p>
          ) : (
            <div className="space-y-1">
              {sortedElements.map((element) => (
                <div
                  key={element.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, element.id)}
                  onDragOver={(e) => handleDragOver(e, element.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, element.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                p-2 rounded border cursor-pointer transition-all
                ${
                  element.id === selectedElementId
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }
                ${draggedId === element.id ? "opacity-50" : ""}
                ${dragOverId === element.id ? "border-blue-500 border-2" : ""}
              `}
                  onClick={() => handleSelectLayer(element.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical
                      size={14}
                      className="text-gray-400 cursor-grab active:cursor-grabbing"
                    />
                    <span>{getElementIcon(element.type)}</span>
                    {editingId === element.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={finishRenaming}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") finishRenaming();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-6 text-xs flex-1"
                      />
                    ) : (
                      <>
                        <span className="text-sm font-medium flex-1 truncate">
                          {element.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(element);
                          }}
                          className="h-5 w-5 p-0 hover:bg-gray-200"
                          title="Rename"
                        >
                          <Pencil size={12} />
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringForward(element.id);
                      }}
                      className="h-6 w-6 p-0"
                      title="Bring forward"
                    >
                      <ArrowUp size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendBackward(element.id);
                      }}
                      className="h-6 w-6 p-0"
                      title="Send backward"
                    >
                      <ArrowDown size={12} />
                    </Button>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-400">
                      z:{element.zIndex}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(element.id);
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
