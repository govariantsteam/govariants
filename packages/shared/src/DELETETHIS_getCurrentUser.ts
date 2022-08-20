// This can be deleted when we have log-ins
// Then we can make a similar getCurrentUser() on the frontend, and just look at
// req.user on the backend.

import { User } from "./api_types";

export function DELETETHIS_getCurrentUser(): User {
  return { username: "The One True User", id: "1" };
}
