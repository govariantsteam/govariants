import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Strict limiter for authentication endpoints (login, registration, guest
 * login). These are the endpoints worth brute-forcing, so the budget is small.
 */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later.",
});

/**
 * Generous limiter for the single-page-app fallback route, which reads
 * index.html off disk. Only unmatched routes reach it — static assets are
 * served by express.static — so normal browsing costs a handful of requests.
 */
export const staticLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
