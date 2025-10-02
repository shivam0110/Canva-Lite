import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import {
  addElement,
  undo,
  redo,
  setCommentsMode,
} from "../../reducers/canvasSlice";
import { type RootState } from "../../store";
import {
  type TextElement,
  type ShapeElement,
  type ShapeType,
} from "../../types/canvas";
import {
  Type,
  Square,
  Circle,
  Triangle,
  Undo2,
  Redo2,
  MessageSquare,
  Download,
} from "lucide-react";
import ActiveUsers from "./ActiveUsers";
import { exportDesign } from "@/actions/designsActions";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export default function Toolbar() {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const historyIndex = useSelector(
    (state: RootState) => state.canvas.historyIndex
  );
  const historyLength = useSelector(
    (state: RootState) => state.canvas.history.length
  );
  const commentsMode = useSelector(
    (state: RootState) => state.canvas.commentsMode
  );

  const handleExport = async () => {
    if (!id) {
      toast.error("Design ID not found");
      return;
    }

    try {
      toast.loading("Exporting design...");
      await exportDesign(id, elements);
      toast.dismiss();
      toast.success("Design exported successfully!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to export design");
      console.error("Export error:", error);
    }
  };

  const addTextElement = () => {
    const maxZIndex =
      elements.length > 0 ? Math.max(...elements.map((el) => el.zIndex)) : -1;
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: "text",
      x: 100,
      y: 100,
      width: 200,
      height: 60,
      rotation: 0,
      zIndex: maxZIndex + 1,
      name: `Text ${elements.filter((e) => e.type === "text").length + 1}`,
      text: "New Text",
      fontSize: 24,
      fontFamily: "Arial",
      color: "#000000",
    };
    dispatch(addElement(newElement));
  };

  const addShapeElement = (shapeType: ShapeType) => {
    const maxZIndex =
      elements.length > 0 ? Math.max(...elements.map((el) => el.zIndex)) : -1;
    const newElement: ShapeElement = {
      id: `shape-${Date.now()}`,
      type: "shape",
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      rotation: 0,
      zIndex: maxZIndex + 1,
      name: `${shapeType} ${
        elements.filter((e) => e.type === "shape").length + 1
      }`,
      shapeType,
      fillColor: "#3b82f6",
      strokeColor: "#1e40af",
      strokeWidth: 2,
    };
    dispatch(addElement(newElement));
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center gap-4 justify-between">
      <div className="flex items-center gap-4">
        {/* Add Elements Section */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addTextElement}
            className="flex items-center gap-2"
          >
            <Type size={16} />
            Text
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addShapeElement("rectangle")}
            className="flex items-center gap-2"
          >
            <Square size={16} />
            Rectangle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addShapeElement("circle")}
            className="flex items-center gap-2"
          >
            <Circle size={16} />
            Circle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addShapeElement("triangle")}
            className="flex items-center gap-2"
          >
            <Triangle size={16} />
            Triangle
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* History Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch(undo())}
            disabled={historyIndex === 0}
            title="Undo"
          >
            <Undo2 size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch(redo())}
            disabled={historyIndex === historyLength - 1}
            title="Redo"
          >
            <Redo2 size={16} />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* Comments Toggle */}
        <Button
          size="sm"
          variant={commentsMode ? "default" : "outline"}
          onClick={() => dispatch(setCommentsMode(!commentsMode))}
          className="flex items-center gap-2"
          title="Toggle Comments Mode"
        >
          <MessageSquare size={16} />
          Comments
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* Export Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2"
          title="Export as PNG"
        >
          <Download size={16} />
          Export
        </Button>
      </div>

      {/* Active Users */}
      <ActiveUsers />
    </div>
  );
}
