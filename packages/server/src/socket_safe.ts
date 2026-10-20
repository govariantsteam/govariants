/**
 * Wraps a socket.io event handler so a thrown error or rejected promise is
 * logged instead of becoming an unhandled rejection. socket.io never awaits
 * or try/catches the handlers it dispatches to, so an unguarded handler can
 * take down the whole process over one bad message from one client.
 */
export function safeSocketHandler<Args extends unknown[]>(
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
