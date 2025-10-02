import { describe, it, expect, beforeEach } from "vitest";
import canvasReducer, {
  addElement,
  updateElement,
  deleteElement,
  selectElement,
  bringForward,
  sendBackward,
  reorderLayer,
  undo,
  redo,
  clearCanvas,
  setElements,
  commitHistory,
} from "../canvasSlice";
import type {
  CanvasState,
  TextElement,
  ShapeElement,
} from "../../types/canvas";

describe("canvasSlice", () => {
  let initialState: CanvasState;

  beforeEach(() => {
    initialState = {
      elements: [],
      selectedElementId: null,
      history: [[]],
      historyIndex: 0,
      isLiveblocksSynced: false,
      commentsMode: false,
    };
  });

  describe("addElement", () => {
    it("should add a text element", () => {
      const textElement: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      const state = canvasReducer(initialState, addElement(textElement));

      expect(state.elements).toHaveLength(1);
      expect(state.elements[0]).toEqual(textElement);
      expect(state.history).toHaveLength(2); // Initial + after add
      expect(state.historyIndex).toBe(1);
    });

    it("should add a shape element", () => {
      const shapeElement: ShapeElement = {
        id: "shape-1",
        type: "shape",
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 0,
        zIndex: 0,
        name: "Rectangle 1",
        shapeType: "rectangle",
        fillColor: "#3b82f6",
        strokeColor: "#1e40af",
        strokeWidth: 2,
      };

      const state = canvasReducer(initialState, addElement(shapeElement));

      expect(state.elements).toHaveLength(1);
      expect(state.elements[0]).toEqual(shapeElement);
    });
  });

  describe("updateElement", () => {
    it("should update element properties", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      state = canvasReducer(
        state,
        updateElement({
          id: "text-1",
          updates: { text: "Updated", fontSize: 32 },
        })
      );

      const updatedElement = state.elements[0] as TextElement;
      expect(updatedElement.text).toBe("Updated");
      expect(updatedElement.fontSize).toBe(32);
    });

    it("should not update non-existent element", () => {
      const state = canvasReducer(
        initialState,
        updateElement({ id: "non-existent", updates: { x: 50 } })
      );

      expect(state.elements).toHaveLength(0);
    });
  });

  describe("deleteElement", () => {
    it("should delete an element", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      state = canvasReducer(state, deleteElement("text-1"));

      expect(state.elements).toHaveLength(0);
    });

    it("should clear selection when deleting selected element", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      state = canvasReducer(state, selectElement("text-1"));
      state = canvasReducer(state, deleteElement("text-1"));

      expect(state.selectedElementId).toBeNull();
    });
  });

  describe("selectElement", () => {
    it("should select an element", () => {
      const state = canvasReducer(initialState, selectElement("text-1"));
      expect(state.selectedElementId).toBe("text-1");
    });

    it("should deselect when null is passed", () => {
      let state = canvasReducer(initialState, selectElement("text-1"));
      state = canvasReducer(state, selectElement(null));
      expect(state.selectedElementId).toBeNull();
    });
  });

  describe("layer ordering", () => {
    beforeEach(() => {
      const element1: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "First",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      const element2: TextElement = {
        id: "text-2",
        type: "text",
        x: 150,
        y: 150,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 1,
        name: "Text 2",
        text: "Second",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      initialState = canvasReducer(initialState, addElement(element1));
      initialState = canvasReducer(initialState, addElement(element2));
    });

    it("should bring element forward", () => {
      const state = canvasReducer(initialState, bringForward("text-1"));
      const text1 = state.elements.find((el) => el.id === "text-1");
      const text2 = state.elements.find((el) => el.id === "text-2");

      expect(text1?.zIndex).toBe(1);
      expect(text2?.zIndex).toBe(0);
    });

    it("should send element backward", () => {
      const state = canvasReducer(initialState, sendBackward("text-2"));
      const text1 = state.elements.find((el) => el.id === "text-1");
      const text2 = state.elements.find((el) => el.id === "text-2");

      expect(text1?.zIndex).toBe(1);
      expect(text2?.zIndex).toBe(0);
    });

    it("should not bring forward if already at top", () => {
      const state = canvasReducer(initialState, bringForward("text-2"));
      const text2 = state.elements.find((el) => el.id === "text-2");
      expect(text2?.zIndex).toBe(1); // Should remain unchanged
    });

    it("should reorder layers via drag and drop", () => {
      const state = canvasReducer(
        initialState,
        reorderLayer({ draggedId: "text-1", targetId: "text-2" })
      );

      const text1 = state.elements.find((el) => el.id === "text-1");
      const text2 = state.elements.find((el) => el.id === "text-2");

      // After reordering, text-1 should have higher zIndex than text-2
      expect(text1!.zIndex).toBeGreaterThan(text2!.zIndex);
    });
  });

  describe("undo/redo", () => {
    it("should undo last action", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      expect(state.elements).toHaveLength(1);

      state = canvasReducer(state, undo());
      expect(state.elements).toHaveLength(0);
      expect(state.historyIndex).toBe(0);
    });

    it("should redo last undone action", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      state = canvasReducer(state, undo());
      state = canvasReducer(state, redo());

      expect(state.elements).toHaveLength(1);
      expect(state.elements[0]).toEqual(element);
    });

    it("should not undo when at initial state", () => {
      const state = canvasReducer(initialState, undo());
      expect(state.historyIndex).toBe(0);
    });

    it("should not redo when at latest state", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      const historyIndexBefore = state.historyIndex;
      state = canvasReducer(state, redo());

      expect(state.historyIndex).toBe(historyIndexBefore);
    });

    it("should maintain history limit of 11 entries", () => {
      let state = initialState;

      // Add 15 elements to exceed history limit
      for (let i = 0; i < 15; i++) {
        const element: TextElement = {
          id: `text-${i}`,
          type: "text",
          x: 100,
          y: 100,
          width: 200,
          height: 60,
          rotation: 0,
          zIndex: i,
          name: `Text ${i}`,
          text: `Text ${i}`,
          fontSize: 24,
          fontFamily: "Arial",
          color: "#000000",
        };
        state = canvasReducer(state, addElement(element));
      }

      expect(state.history.length).toBeLessThanOrEqual(11);
    });
  });

  describe("clearCanvas", () => {
    it("should clear all elements and reset history", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      state = canvasReducer(state, clearCanvas());

      expect(state.elements).toHaveLength(0);
      expect(state.selectedElementId).toBeNull();
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });
  });

  describe("setElements", () => {
    it("should replace all elements", () => {
      const elements: TextElement[] = [
        {
          id: "text-1",
          type: "text",
          x: 100,
          y: 100,
          width: 200,
          height: 60,
          rotation: 0,
          zIndex: 0,
          name: "Text 1",
          text: "First",
          fontSize: 24,
          fontFamily: "Arial",
          color: "#000000",
        },
        {
          id: "text-2",
          type: "text",
          x: 150,
          y: 150,
          width: 200,
          height: 60,
          rotation: 0,
          zIndex: 1,
          name: "Text 2",
          text: "Second",
          fontSize: 24,
          fontFamily: "Arial",
          color: "#000000",
        },
      ];

      const state = canvasReducer(initialState, setElements(elements));
      expect(state.elements).toEqual(elements);
    });
  });

  describe("commitHistory", () => {
    it("should save current state to history", () => {
      const element: TextElement = {
        id: "text-1",
        type: "text",
        x: 100,
        y: 100,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: 0,
        name: "Text 1",
        text: "Hello",
        fontSize: 24,
        fontFamily: "Arial",
        color: "#000000",
      };

      let state = canvasReducer(initialState, addElement(element));
      const historyLengthBefore = state.history.length;

      state = canvasReducer(state, commitHistory());

      expect(state.history.length).toBeGreaterThan(historyLengthBefore);
    });
  });
});
