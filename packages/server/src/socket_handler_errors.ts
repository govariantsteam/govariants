/**
 * Wraps a socket.io event handler so a thrown error or rejected promise is
 * logged instead of becoming an unhandled rejection.
 */
export function catchSocketHandlerErrors<Args extends unknown[]>(
  handler: (...args: Args) => void | Promise<void>,
): (...args: Args) => void {
  return (...args: Args) => {
    Promise.resolve()
      .then(() => handler(...args))
      .catch((err) => {
        console.error("Unhandled error in socket event handler:", err);
      });
  };
}
