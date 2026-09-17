import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { config } from "./config.js";

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (request.header("x-admin-key") !== config.adminApiKey) {
    return response.status(401).json({ error: "Admin access is required." });
  }
  next();
}

export function notFound(_request: Request, response: Response) {
  response.status(404).json({ error: "Route not found." });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  console.error(error);
  if (error instanceof ZodError) {
    return response.status(400).json({ error: "Invalid request data.", details: error.flatten() });
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return response.status(409).json({ error: "A place with this slug already exists." });
  }
  response.status(500).json({ error: "Something went wrong." });
}
