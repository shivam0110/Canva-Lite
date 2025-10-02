const express = require("express");
const router = express.Router();
const { clerkClient } = require("@clerk/clerk-sdk-node");

// POST /api/users/batch - Get multiple users by their IDs
router.post("/batch", async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds array is required" });
    }

    // Fetch all users in parallel
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await clerkClient.users.getUser(userId);
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          // Return minimal data if user fetch fails
          return {
            id: userId,
            firstName: userId,
            username: userId,
          };
        }
      })
    );

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/search - Search users for @mentions
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    // Fetch users from Clerk with optional search query
    const response = await clerkClient.users.getUserList({
      query: q || undefined,
      limit: 10,
    });

    // Handle different response structures from Clerk
    const users = response?.data || response || [];

    if (!Array.isArray(users)) {
      console.error("Unexpected response format from Clerk:", response);
      return res.json([]);
    }

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

module.exports = router;
