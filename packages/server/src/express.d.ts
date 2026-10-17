import { UserResponse } from "@govariants/shared";

declare global {
  namespace Express {
    interface User extends UserResponse {}
  }
}
