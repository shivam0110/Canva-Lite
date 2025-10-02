const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { Design } = require("../models/Design");
const designsRouter = require("../routes/designs");
const { z } = require("zod");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/designs", designsRouter);

// Mock Design model
jest.mock("../models/Design");

describe("Designs API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/designs", () => {
    it("should create a new design with valid data", async () => {
      const mockDesign = {
        _id: "123",
        title: "Test Design",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      Design.mockImplementation(() => mockDesign);

      const response = await request(app)
        .post("/api/designs")
        .send({
          title: "Test Design",
          width: 1080,
          height: 1080,
          userId: "user-123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Test Design");
      expect(response.body.width).toBe(1080);
      expect(response.body.height).toBe(1080);
    });

    // Note: Validation is thoroughly tested in validation.test.js
    // These tests focus on API integration with mocked database
  });

  describe("GET /api/designs/user/:userId", () => {
    it("should fetch designs for a user", async () => {
      const mockDesigns = [
        {
          _id: "123",
          title: "Design 1",
          width: 1080,
          height: 1080,
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "124",
          title: "Design 2",
          width: 800,
          height: 600,
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      Design.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDesigns),
        }),
      });

      const response = await request(app)
        .get("/api/designs/user/user-123")
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe("Design 1");
      expect(response.body[1].title).toBe("Design 2");
    });

    it("should return empty array for user with no designs", async () => {
      Design.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app)
        .get("/api/designs/user/user-999")
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe("GET /api/designs/:id", () => {
    it("should fetch a single design by ID", async () => {
      const mockDesign = {
        _id: "123",
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
            text: "Hello",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      Design.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockDesign),
      });

      const response = await request(app).get("/api/designs/123").expect(200);

      expect(response.body.title).toBe("Test Design");
      expect(response.body.canvasElements).toHaveLength(1);
    });

    it("should return 404 for non-existent design", async () => {
      Design.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app)
        .get("/api/designs/nonexistent")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/designs/:id", () => {
    it("should update a design", async () => {
      const mockUpdatedDesign = {
        _id: "123",
        title: "Updated Title",
        width: 1080,
        height: 1080,
        userId: "user-123",
        canvasElements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      Design.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdatedDesign),
      });

      const response = await request(app)
        .put("/api/designs/123")
        .send({
          title: "Updated Title",
        })
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
    });

    it("should return 404 when updating non-existent design", async () => {
      Design.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app)
        .put("/api/designs/nonexistent")
        .send({
          title: "Updated Title",
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/designs/:id", () => {
    it("should delete a design", async () => {
      const mockDesign = {
        _id: "123",
        title: "Test Design",
      };

      Design.findByIdAndDelete = jest.fn().mockResolvedValue(mockDesign);

      const response = await request(app)
        .delete("/api/designs/123")
        .expect(200);

      expect(response.body.message).toBe("Design deleted successfully");
      expect(response.body.id).toBe("123");
    });

    it("should return 404 when deleting non-existent design", async () => {
      Design.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/designs/nonexistent")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });
});
