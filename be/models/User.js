const mongoose = require("mongoose");
const { z } = require("zod");

// Zod validation schema
const userValidationSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// Mongoose schema
const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: String,
    lastName: String,
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

// Validation method
userSchema.methods.validate = function () {
  return userValidationSchema.parse({
    clerkId: this.clerkId,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    imageUrl: this.imageUrl,
  });
};

const User = mongoose.model("User", userSchema);

module.exports = { User, userValidationSchema };
