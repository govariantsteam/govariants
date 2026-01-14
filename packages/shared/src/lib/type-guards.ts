import { GameErrorResponse, GameInitialResponse } from "../api_types";

export function isErrorResult(
  dto: GameInitialResponse | GameErrorResponse,
): dto is GameErrorResponse {
  const stateProperty: Exclude<
    keyof GameInitialResponse,
    keyof GameErrorResponse
  > = "state";
  return !(stateProperty in dto);
}
