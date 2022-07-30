import { BadukState, Color } from "@ogfcommunity/variants-shared";
import { GameViewProps } from "../view_types";
import { map2d, GridBoard, Stone } from "../boards";

export function BadukView({ gamestate, onMove }: GameViewProps<BadukState>) {
  const processed_board: Stone[][] = map2d(gamestate.board, (color) => {
    switch (color) {
      case Color.BLACK:
        return { color: "black" };
      case Color.WHITE:
        return { color: "white" };
      case Color.EMPTY:
        return {};
    }
  });
  const onClick = (pos: { x: number; y: number }) => {
    onMove({ [gamestate.next_to_play]: coordsToLetters(pos.x, pos.y) });
  };

  return <GridBoard board={processed_board} onClick={onClick} />;
}

function coordsToLetters(x: number, y: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[x] + alphabet[y];
}
