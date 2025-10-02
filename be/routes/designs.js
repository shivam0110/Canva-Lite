const express = require("express");
const router = express.Router();
const { Design, designValidationSchema } = require("../models/Design");
const { z } = require("zod");
const { createCanvas } = require("canvas");

// Create a new design
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const validatedData = designValidationSchema.parse(req.body);

    // Create design
    const design = new Design(validatedData);
    await design.save();

    res.status(201).json({
      id: design._id,
      title: design.title,
      width: design.width,
      height: design.height,
      userId: design.userId,
      thumbnail: design.thumbnail,
      canvasElements: design.canvasElements,
      liveblocksRoom: design.liveblocksRoom,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating design:", error);
    res.status(500).json({ error: "Failed to create design" });
  }
});

// Get all designs for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const designs = await Design.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedDesigns = designs.map((design) => ({
      id: design._id.toString(),
      title: design.title,
      width: design.width,
      height: design.height,
      userId: design.userId,
      thumbnail: design.thumbnail,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    }));

    res.json(formattedDesigns);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({ error: "Failed to fetch designs" });
  }
});

// Get a single design by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const design = await Design.findById(id).lean();

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    res.json({
      id: design._id.toString(),
      title: design.title,
      width: design.width,
      height: design.height,
      userId: design.userId,
      thumbnail: design.thumbnail,
      canvasElements: design.canvasElements,
      liveblocksRoom: design.liveblocksRoom,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// Update a design (including canvas elements and Liveblocks data)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // For updates, validate only the provided fields
    const validatedData = req.body;

    const design = await Design.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    res.json({
      id: design._id.toString(),
      title: design.title,
      width: design.width,
      height: design.height,
      userId: design.userId,
      thumbnail: design.thumbnail,
      canvasElements: design.canvasElements,
      liveblocksRoom: design.liveblocksRoom,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating design:", error);
    res.status(500).json({ error: "Failed to update design" });
  }
});

// Export design as PNG
router.post("/:id/export", async (req, res) => {
  try {
    const { id } = req.params;
    const { canvasElements } = req.body;

    // Get the design to get width and height
    const design = await Design.findById(id).lean();

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    const width = design.width || 800;
    const height = design.height || 600;

    // Create a canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fill background with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Sort elements by zIndex
    const sortedElements = [...(canvasElements || [])].sort(
      (a, b) => a.zIndex - b.zIndex
    );

    // Render each element
    for (const element of sortedElements) {
      ctx.save();

      // Apply transformations
      ctx.translate(
        element.x + element.width / 2,
        element.y + element.height / 2
      );
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.width / 2, -element.height / 2);

      switch (element.type) {
        case "text":
          ctx.fillStyle = element.color || "#000000";
          ctx.font = `${element.fontSize}px ${element.fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            element.text || "",
            element.width / 2,
            element.height / 2
          );
          break;

        case "shape":
          ctx.fillStyle = element.fillColor || "#3b82f6";
          ctx.strokeStyle = element.strokeColor || "#1e40af";
          ctx.lineWidth = element.strokeWidth || 2;

          if (element.shapeType === "rectangle") {
            ctx.fillRect(0, 0, element.width, element.height);
            ctx.strokeRect(0, 0, element.width, element.height);
          } else if (element.shapeType === "circle") {
            const radius = Math.min(element.width, element.height) / 2;
            const centerX = element.width / 2;
            const centerY = element.height / 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          } else if (element.shapeType === "triangle") {
            ctx.beginPath();
            ctx.moveTo(element.width / 2, 0);
            ctx.lineTo(element.width, element.height);
            ctx.lineTo(0, element.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          break;

        case "image":
          // Image rendering would require loading the image
          // For now, we'll skip or show a placeholder
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, element.width, element.height);
          break;
      }

      ctx.restore();
    }

    // Convert to PNG buffer
    const buffer = canvas.toBuffer("image/png");

    // Sanitize filename (remove special characters)
    const sanitizedTitle = design.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    // Send the PNG
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedTitle}.png"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting design:", error);
    res.status(500).json({ error: "Failed to export design" });
  }
});

// Delete a design
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const design = await Design.findByIdAndDelete(id);

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    res.json({
      message: "Design deleted successfully",
      id: design._id.toString(),
    });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ error: "Failed to delete design" });
  }
});

module.exports = router;
