const { z } = require("zod");
const { designValidationSchema } = require("../models/Design");

describe("Design Validation", () => {
  describe("designValidationSchema", () => {
    it("should validate correct design data", () => {
      const validData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [],
      };

      const result = designValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
        width: 1080,
        height: 1080,
        userId: "user-123",
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject title longer than 100 characters", () => {
      const invalidData = {
        title: "a".repeat(101),
        width: 1080,
        height: 1080,
        userId: "user-123",
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative width", () => {
      const invalidData = {
        title: "Test Design",
        width: -100,
        height: 1080,
        userId: "user-123",
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject zero height", () => {
      const invalidData = {
        title: "Test Design",
        width: 1080,
        height: 0,
        userId: "user-123",
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const invalidData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional thumbnail", () => {
      const validData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        thumbnail: "https://example.com/thumb.jpg",
      };

      const result = designValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept optional liveblocksRoom", () => {
      const validData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        liveblocksRoom: "room-123",
      };

      const result = designValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate canvas elements structure", () => {
      const validData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [
          {
            id: "text-1",
            type: "text",
            x: 100,
            y: 100,
            width: 200,
            height: 60,
            rotation: 0,
            zIndex: 0,
            text: "Hello",
            fontSize: 24,
            fontFamily: "Arial",
            color: "#000000",
          },
        ],
      };

      const result = designValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid element type", () => {
      const invalidData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [
          {
            id: "invalid-1",
            type: "invalid-type",
            x: 100,
            y: 100,
            width: 200,
            height: 60,
            rotation: 0,
            zIndex: 0,
          },
        ],
      };

      const result = designValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept all valid element types", () => {
      const validData = {
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [
          {
            id: "text-1",
            type: "text",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 0,
          },
          {
            id: "image-1",
            type: "image",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 1,
          },
          {
            id: "shape-1",
            type: "shape",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 2,
          },
        ],
      };

      const result = designValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
