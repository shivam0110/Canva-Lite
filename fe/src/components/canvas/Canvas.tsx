import { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "../../store";
import {
  selectElement,
  updateElement,
  commitHistory,
  setCommentsMode,
} from "../../reducers/canvasSlice";
import { type CanvasElement } from "../../types/canvas";
import { useUpdateMyPresence } from "../../../liveblocks.config";
import { Composer } from "@liveblocks/react-ui";
import TransformHandles from "./TransformHandles";
import CommentsOverlay from "./CommentsOverlay";
import NewCommentCursor from "./NewCommentCursor";

interface CanvasProps {
  width: number;
  height: number;
}

export default function Canvas({ width, height }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const elements = useSelector((state: RootState) => state.canvas.elements);
  const selectedElementId = useSelector(
    (state: RootState) => state.canvas.selectedElementId
  );
  const commentsMode = useSelector(
    (state: RootState) => state.canvas.commentsMode
  );
  const dispatch = useDispatch();
  const updateMyPresence = useUpdateMyPresence();
  const [draftComment, setDraftComment] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (commentsMode) {
      // Set draft comment position to show composer
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDraftComment({ x, y });
      }
      return;
    }

    if (e.target === e.currentTarget) {
      dispatch(selectElement(null));
      updateMyPresence({ selectedElementId: null });
    }
  };

  const handleCommentSubmit = async () => {
    // Composer already created the thread with metadata
    // Just clean up state and exit comments mode
    setDraftComment(null);
    dispatch(setCommentsMode(false));
  };

  const handleCommentCancel = (e?: React.MouseEvent) => {
    // Stop event propagation to prevent triggering canvas click
    e?.stopPropagation();
    e?.preventDefault();
    setDraftComment(null);
  };

  // Handle Escape key to cancel draft comment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && draftComment) {
        handleCommentCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draftComment]);

  // Handle click outside composer to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        draftComment &&
        composerRef.current &&
        !composerRef.current.contains(e.target as Node)
      ) {
        handleCommentCancel();
      }
    };

    if (draftComment) {
      // Add a small delay to prevent the initial click from immediately closing it
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [draftComment]);

  const handleElementClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(selectElement(id));
    updateMyPresence({ selectedElementId: id });
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = element.id === selectedElementId;
    const style: React.CSSProperties = {
      position: "absolute",
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      transformOrigin: "center",
      cursor: "move",
      border: isSelected ? "2px solid #3b82f6" : "none",
      userSelect: "none",
    };

    switch (element.type) {
      case "text":
        return (
          <div
            key={element.id}
            style={{
              ...style,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              color: element.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isSelected ? "2px solid #3b82f6" : "1px dashed #ccc",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "hidden",
            }}
            onClick={(e) => handleElementClick(e, element.id)}
          >
            {element.text || "Double click to edit"}
          </div>
        );

      case "image":
        return (
          <div
            key={element.id}
            style={{
              ...style,
              opacity: element.opacity,
              borderRadius: element.borderRadius,
              overflow: "hidden",
              backgroundColor: "#f0f0f0",
            }}
            onClick={(e) => handleElementClick(e, element.id)}
          >
            {element.src ? (
              <img
                src={element.src}
                alt="Canvas element"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#999",
                }}
              >
                No image
              </div>
            )}
          </div>
        );

      case "shape": {
        const shapeStyle: React.CSSProperties = {
          ...style,
          backgroundColor: element.fillColor,
          border: `${element.strokeWidth}px solid ${element.strokeColor}`,
        };

        if (element.shapeType === "circle") {
          shapeStyle.borderRadius = "50%";
        } else if (element.shapeType === "triangle") {
          shapeStyle.backgroundColor = "transparent";
          shapeStyle.border = "none";
        }

        return (
          <div
            key={element.id}
            style={shapeStyle}
            onClick={(e) => handleElementClick(e, element.id)}
            data-element-id={element.id}
          >
            {element.shapeType === "triangle" && (
              <svg width="100%" height="100%" style={{ pointerEvents: "none" }}>
                <polygon
                  points={`${element.width / 2},0 ${element.width},${
                    element.height
                  } 0,${element.height}`}
                  fill={element.fillColor}
                  stroke={element.strokeColor}
                  strokeWidth={element.strokeWidth}
                />
              </svg>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <NewCommentCursor display={commentsMode && !draftComment} />
      <div
        ref={canvasRef}
        className="relative bg-white shadow-lg"
        style={{
          width,
          height,
          cursor: commentsMode && !draftComment ? "none" : "auto",
        }}
        onClick={handleCanvasClick}
      >
        {sortedElements.map(renderElement)}
        {selectedElement && !commentsMode && (
          <TransformHandles
            element={selectedElement}
            onUpdate={(updates) => {
              dispatch(updateElement({ id: selectedElement.id, updates }));
            }}
            onCommit={() => {
              dispatch(commitHistory());
            }}
          />
        )}
        <CommentsOverlay canvasRef={canvasRef} />

        {/* Draft Comment Composer */}
        {draftComment && (
          <div
            ref={composerRef}
            className="absolute z-50"
            style={{
              left: `${draftComment.x}px`,
              top: `${draftComment.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-80 rounded-lg bg-white shadow-xl border border-gray-200 p-4">
              <Composer
                onComposerSubmit={handleCommentSubmit}
                metadata={{
                  x: draftComment.x,
                  y: draftComment.y,
                  resolved: false,
                }}
                autoFocus
              />
              <button
                onClick={handleCommentCancel}
                onMouseDown={(e) => e.stopPropagation()}
                className="mt-2 w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
