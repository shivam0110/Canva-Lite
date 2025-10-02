const mongoose = require("mongoose");
const { z } = require("zod");

// Zod validation schema for canvas elements
const canvasElementSchema = z
  .object({
    id: z.string(),
    type: z.enum(["text", "image", "shape"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number().default(0),
    zIndex: z.number(),
  })
  .passthrough(); // Allow additional properties for specific element types

// Zod validation schema for design
const designValidationSchema = z.object({
  title: z.string().min(1).max(100),
  width: z.number().positive(),
  height: z.number().positive(),
  userId: z.string().min(1),
  thumbnail: z.string().optional(),
  canvasElements: z.array(canvasElementSchema).default([]),
  liveblocksRoom: z.string().optional(),
});

// Mongoose schema
const designSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    // Store canvas elements as JSON
    canvasElements: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    // Store Liveblocks room ID for real-time collaboration
    liveblocksRoom: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
designSchema.index({ userId: 1, createdAt: -1 });

// Validation method
designSchema.methods.validate = function () {
  return designValidationSchema.parse({
    title: this.title,
    width: this.width,
    height: this.height,
    userId: this.userId,
    thumbnail: this.thumbnail,
    canvasElements: this.canvasElements,
    liveblocksRoom: this.liveblocksRoom,
  });
};

const Design = mongoose.model("Design", designSchema);

module.exports = { Design, designValidationSchema };
