import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Canvas from "../components/canvas/Canvas";
import Toolbar from "../components/canvas/Toolbar";
import LayersPanel from "../components/canvas/LayersPanel";
import PropertiesPanel from "../components/canvas/PropertiesPanel";
import Room from "../components/canvas/Room";
import { setElements, clearCanvas } from "../reducers/canvasSlice";
import { fetchDesignById } from "../actions/designsActions";
import type { AppDispatch } from "../store";
import type { Design } from "../types";
import type { CanvasElement } from "../types/canvas";

interface DesignWithElements extends Design {
  canvasElements?: CanvasElement[];
}

function DesignEditor() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [design, setDesign] = useState<DesignWithElements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDesign = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const designData = await fetchDesignById(id);
        setDesign(designData);

        // Load canvas elements if they exist, otherwise clear canvas
        if (designData.canvasElements && designData.canvasElements.length > 0) {
          dispatch(setElements(designData.canvasElements));
        } else {
          dispatch(clearCanvas());
        }
      } catch (error) {
        console.error("Failed to load design:", error);
        dispatch(clearCanvas());
      } finally {
        setLoading(false);
      }
    };

    loadDesign();
  }, [id, dispatch]);

  if (!id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Design not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          <p className="text-gray-600">Loading design...</p>
        </div>
      </div>
    );
  }

  return (
    <Room roomId={`design-${id}`} designId={id}>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Top Toolbar */}
        <Toolbar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Layers Panel */}
          <div className="flex-shrink-0">
            <LayersPanel />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-start justify-center p-8 overflow-auto">
            <Canvas
              width={design?.width || 800}
              height={design?.height || 600}
            />
          </div>

          {/* Right Properties Panel */}
          <div className="flex-shrink-0">
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </Room>
  );
}

export default DesignEditor;
