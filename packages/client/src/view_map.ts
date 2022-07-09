import { BadukView } from "./baduk";

// Is there any way we can get away from `any` here?
// I think only the infra needs to touch these functions, but still!
export const view_map = {
  baduk: BadukView,
} as const;
