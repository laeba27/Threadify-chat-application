import express from "express";
import cors from "cors";
import helmet from "helmet";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "./config/clerk.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  // CORS configuration - must be before other middleware
  app.use(
    cors({
      origin: ["http://localhost:4000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Handle preflight requests
  app.options("*", cors());

  app.use(clerkMiddleware());

  app.use(helmet());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
