import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type CanvasElement, type CanvasState } from "../types/canvas";

const initialState: CanvasState = {
  elements: [],
  selectedElementId: null,
  history: [[]],
  historyIndex: 0,
  isLiveblocksSynced: false,
  commentsMode: false,
};

const MAX_HISTORY = 11; // 10+ actions (undo/redo)

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    addElement: (state, action: PayloadAction<CanvasElement>) => {
      state.elements.push(action.payload);
      saveToHistory(state);
    },
    updateElement: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<CanvasElement> }>
    ) => {
      const element = state.elements.find((el) => el.id === action.payload.id);
      if (element) {
        Object.assign(element, action.payload.updates);
      }
    },
    deleteElement: (state, action: PayloadAction<string>) => {
      state.elements = state.elements.filter((el) => el.id !== action.payload);
      if (state.selectedElementId === action.payload) {
        state.selectedElementId = null;
      }
      saveToHistory(state);
    },
    selectElement: (state, action: PayloadAction<string | null>) => {
      state.selectedElementId = action.payload;
    },
    bringForward: (state, action: PayloadAction<string>) => {
      const element = state.elements.find((el) => el.id === action.payload);
      if (element) {
        const maxZIndex = Math.max(...state.elements.map((el) => el.zIndex), 0);
        if (element.zIndex < maxZIndex) {
          const nextZIndex = element.zIndex + 1;
          const blockingElement = state.elements.find(
            (el) => el.zIndex === nextZIndex
          );
          if (blockingElement) {
            blockingElement.zIndex = element.zIndex;
          }
          element.zIndex = nextZIndex;
        }
      }
      saveToHistory(state);
    },
    sendBackward: (state, action: PayloadAction<string>) => {
      const element = state.elements.find((el) => el.id === action.payload);
      if (element) {
        const minZIndex = Math.min(...state.elements.map((el) => el.zIndex), 0);
        if (element.zIndex > minZIndex) {
          const nextZIndex = element.zIndex - 1;
          const blockingElement = state.elements.find(
            (el) => el.zIndex === nextZIndex
          );
          if (blockingElement) {
            blockingElement.zIndex = element.zIndex;
          }
          element.zIndex = nextZIndex;
        }
      }
      saveToHistory(state);
    },
    reorderLayer: (
      state,
      action: PayloadAction<{ draggedId: string; targetId: string }>
    ) => {
      const { draggedId, targetId } = action.payload;

      // Sort elements by zIndex to get the visual order
      const sortedElements = [...state.elements].sort(
        (a, b) => b.zIndex - a.zIndex
      );

      // Find indices in the sorted array
      const draggedIndex = sortedElements.findIndex(
        (el) => el.id === draggedId
      );
      const targetIndex = sortedElements.findIndex((el) => el.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged element
        const [draggedElement] = sortedElements.splice(draggedIndex, 1);
        // Insert at target position
        sortedElements.splice(targetIndex, 0, draggedElement);

        // Reassign zIndex values based on new order (highest to lowest)
        sortedElements.forEach((element, index) => {
          element.zIndex = sortedElements.length - 1 - index;
        });
      }
      saveToHistory(state);
    },
    commitHistory: (state) => {
      saveToHistory(state);
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
        state.elements = JSON.parse(
          JSON.stringify(state.history[state.historyIndex])
        );
        state.selectedElementId = null;
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
        state.elements = JSON.parse(
          JSON.stringify(state.history[state.historyIndex])
        );
        state.selectedElementId = null;
      }
    },
    clearCanvas: (state) => {
      state.elements = [];
      state.selectedElementId = null;
      state.history = [[]];
      state.historyIndex = 0;
    },
    setElements: (state, action: PayloadAction<CanvasElement[]>) => {
      state.elements = action.payload;
    },
    setSyncStatus: (state, action: PayloadAction<boolean>) => {
      state.isLiveblocksSynced = action.payload;
    },
    setCommentsMode: (state, action: PayloadAction<boolean>) => {
      state.commentsMode = action.payload;
    },
  },
});

function saveToHistory(state: CanvasState) {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state.elements)));

  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
    state.history = newHistory;
    state.historyIndex = newHistory.length - 1;
  } else {
    state.history = newHistory;
    state.historyIndex = newHistory.length - 1;
  }
}

export const {
  addElement,
  updateElement,
  deleteElement,
  selectElement,
  bringForward,
  sendBackward,
  reorderLayer,
  commitHistory,
  undo,
  redo,
  clearCanvas,
  setElements,
  setSyncStatus,
  setCommentsMode,
} = canvasSlice.actions;

export default canvasSlice.reducer;
