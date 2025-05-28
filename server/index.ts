import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDatabase, pool } from "./db";
import connectPgSimple from "connect-pg-simple";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session with memory store for development simplicity
// We're avoiding PostgreSQL store due to schema compatibility issues
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-long-random-string',
  resave: true, // Changed to true to ensure session is saved on every request
  saveUninitialized: true, // Changed to true to save new sessions
  cookie: {
    secure: false, // Set to false for development to allow HTTP
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    sameSite: 'lax' // Added to improve session handling with navigation
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection
  await initDatabase();
  
  const server = await registerRoutes(app);

  // Comprehensive error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
      message: isProduction && status === 500 ? "Internal Server Error" : message,
      ...(isProduction ? {} : { stack: err.stack, details: err })
    };

    res.status(status).json(errorResponse);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
