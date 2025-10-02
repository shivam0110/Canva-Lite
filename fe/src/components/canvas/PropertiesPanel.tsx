import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { updateElement } from "../../reducers/canvasSlice";
import { type RootState } from "../../store";
import { type CanvasElement } from "../../types/canvas";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const selectedElementId = useSelector(
    (state: RootState) => state.canvas.selectedElementId
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (selectedElementId) {
      dispatch(updateElement({ id: selectedElementId, updates }));
    }
  };

  return (
    <div
      className={`h-full bg-gray-50 border-l border-gray-200 overflow-y-auto transition-all ${
        isCollapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-6 w-6 p-0 hover:bg-gray-200"
          title={
            isCollapsed
              ? "Expand Properties Panel"
              : "Collapse Properties Panel"
          }
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Settings size={18} />
            <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
          </div>
        )}
      </div>

      {!isCollapsed && selectedElement && (
        <div className="px-4 pb-4 space-y-6">
          {selectedElement.type === "text" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Text</Label>
                <Input
                  value={selectedElement.text}
                  onChange={(e) =>
                    updateSelectedElement({ text: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Font Size</Label>
                <Input
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) =>
                    updateSelectedElement({
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={selectedElement.fontFamily}
                  onValueChange={(value) =>
                    updateSelectedElement({ fontFamily: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">
                      Times New Roman
                    </SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) =>
                    updateSelectedElement({ color: e.target.value })
                  }
                  className="mt-1 h-10"
                />
              </div>
            </div>
          )}

          {selectedElement.type === "shape" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Fill Color</Label>
                <Input
                  type="color"
                  value={selectedElement.fillColor}
                  onChange={(e) =>
                    updateSelectedElement({ fillColor: e.target.value })
                  }
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke Color</Label>
                <Input
                  type="color"
                  value={selectedElement.strokeColor}
                  onChange={(e) =>
                    updateSelectedElement({ strokeColor: e.target.value })
                  }
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke Width</Label>
                <Input
                  type="number"
                  value={selectedElement.strokeWidth}
                  onChange={(e) =>
                    updateSelectedElement({
                      strokeWidth: Number(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Common Properties */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-xs font-semibold text-gray-600">
              Position & Transform
            </h4>
            <div>
              <Label className="text-xs">X Position</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) =>
                  updateSelectedElement({ x: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Y Position</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) =>
                  updateSelectedElement({ y: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Rotation (deg)</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.rotation)}
                onChange={(e) =>
                  updateSelectedElement({ rotation: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
