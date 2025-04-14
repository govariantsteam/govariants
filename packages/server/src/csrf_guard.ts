import { randomBytes } from "node:crypto";
import express from "express";
// Based on https://medium.com/@brakdemir/csrf-prevention-on-node-js-express-without-csurf-da5d9e6272ad
// using the Synchronizer Token Pattern

/**
 * @desc Generates a token for the purpose of protecting against csrf,
 * and adds it to the session.
 */
// TODO: improve types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function generateCSRFToken(req: any) {
  const token = randomBytes(36).toString("base64");
  req.session.csrfToken = token;
}

/**
 * @desc Checks and compares the tokens from the request header and session.
 */
// TODO: improve types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function checkCSRFToken(
  req: any,
  res: express.Response,
  next: express.NextFunction,
) {
  try {
    const sessionCsrfToken = req.session.csrfToken;
    if (!sessionCsrfToken) {
      next();
      return;
    }
    const requestCsrfToken = req.get("CSRF-Token");
    if (!requestCsrfToken) {
      res.status(401).json({
        result: false,
        message: "Token has not been provided.",
      });
      return;
    }
    if (requestCsrfToken !== sessionCsrfToken) {
      res.status(401).json({
        result: false,
        message: "Invalid token.",
      });
      return;
    }
    next();
  } catch (e) {
    res.status(500).json({ result: false, message: e.message });
    return;
  }
}
