const express = require("express");
const router = express.Router();
const { Liveblocks } = require("@liveblocks/node");
const { clerkClient } = require("@clerk/clerk-sdk-node");

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

// POST /api/liveblocks/auth - Authenticate user with Liveblocks
router.post("/auth", async (req, res) => {
  try {
    const { room } = req.body;
    const authHeader = req.headers.authorization;

    let userId = "anonymous-user";
    let userInfo = {
      name: "Anonymous",
      avatar: undefined,
      color: "#999999",
    };

    // If Clerk token provided, verify and get real user info
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const sessionClaims = await clerkClient.verifyToken(token);
        const clerkUserId = sessionClaims.sub;

        // Fetch user details from Clerk
        const user = await clerkClient.users.getUser(clerkUserId);

        userId = user.id;
        userInfo = {
          name: user.firstName || user.username || user.id,
          avatar: user.imageUrl || undefined,
          color: getColorForUser(user.id),
        };
      } catch (err) {
        console.error("❌ Failed to verify Clerk token:", err.message);
        console.error("Error details:", err);
        // Continue with anonymous user
      }
    } else {
      console.log("⚠️  No valid authorization header found");
    }

    // Create a session for this user in this room
    const session = liveblocks.prepareSession(userId, {
      userInfo,
    });

    // Give user access to the room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return the token
    const { status, body } = await session.authorize();
    res.status(status).send(body);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    res.status(500).json({ error: "Failed to authorize" });
  }
});

// Helper to generate consistent color per user
function getColorForUser(userId) {
  const colors = [
    "#DC2626",
    "#D97706",
    "#059669",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
  ];
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

module.exports = router;
