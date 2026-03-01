/**
 * Custom error class for HTTP errors.
 * Express 5 automatically catches rejected promises in async handlers
 * and forwards them to the error-handling middleware. Throw an HttpError
 * when you need a specific HTTP status code; otherwise a plain Error
 * will result in a 500.
 */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
