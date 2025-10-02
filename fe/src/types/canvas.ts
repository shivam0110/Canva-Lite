export type ElementType = "text" | "image" | "shape"; // haven't implemented image yet
export type ShapeType = "rectangle" | "circle" | "triangle";

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  name: string;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  opacity: number;
  borderRadius: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement;

export interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  history: CanvasElement[][];
  historyIndex: number;
  isLiveblocksSynced: boolean;
  commentsMode: boolean;
}
