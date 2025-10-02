require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./db");

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) return callback(null, true);

      if ([process.env.FRONTEND_URL].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
const usersRouter = require("./routes/users");
const liveblocksRouter = require("./routes/liveblocks");
const designsRouter = require("./routes/designs");

app.use("/api/users", usersRouter);
app.use("/api/liveblocks", liveblocksRouter);
app.use("/api/designs", designsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
