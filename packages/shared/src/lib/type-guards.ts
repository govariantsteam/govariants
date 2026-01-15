import { GameErrorResponse, GameInitialResponse } from "../api_types";

export function isErrorResult(
  dto: GameInitialResponse | GameErrorResponse,
): dto is GameErrorResponse {
  const errorProperty: Exclude<
    keyof GameErrorResponse,
    keyof GameInitialResponse
  > = "errorMessage";
  return errorProperty in dto;
}
