import { UserResponse } from "@govariants/shared";

// Augment passport's `Express.User` so `req.user` is already a `UserResponse`,
// without needing an `as UserResponse`/`as User` cast at every use site.
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merge, not a real empty interface
    interface User extends UserResponse {}
  }
}
