import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Counts hits in memory, which assumes we run as a single process. Scaling out
 * would need a shared store rather than different numbers.
 */
function rateLimitWithJsonError(limit: number, message: string) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Match the rest of the API's error shape — a bare JSON string — instead
    // of express-rate-limit's default plain-text body, so clients can parse
    // every error response the same way.
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(message);
    },
  });
}

/**
 * Strict limiter for authentication endpoints (login, registration, guest
 * login). These are the endpoints worth brute-forcing, so the budget is small.
 */
export const authLimiter = rateLimitWithJsonError(
  30,
  "Too many authentication attempts, please try again later.",
);

/**
 * Generous limiter for the single-page-app fallback route, which reads
 * index.html off disk. Only unmatched routes reach it — static assets are
 * served by express.static — so normal browsing costs a handful of requests.
 */
export const staticLimiter = rateLimitWithJsonError(
  1000,
  "Too many requests, please try again later.",
);
