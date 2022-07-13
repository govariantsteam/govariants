import { GameViewProps } from "../view_types";
import { map2d, GridBoard, Stone } from "../boards";
import { TicTacToeState } from "@ogfcommunity/variants-shared";

export function TicTacToeView({
  gamestate,
  onMove,
}: GameViewProps<TicTacToeState>) {
  // We could implement a tic tac toe board, but since this is a go variants
  // server, might as well use a Go board :)
  // The following statement turns Xs and Os into something GridBoard can
  // understand
  const board: Stone[][] = map2d(gamestate.grid, (space_state) => {
    switch (space_state) {
      case "x":
        return { color: "black" };
      case "o":
        return { color: "white" };
      case undefined:
        return {};
    }
  });

  // e.g. if player 0 clicks the center of a 3x3 board,
  // the move object { 0: "11" } will be sent to the server.
  const onClick = (pos: { x: number; y: number }) => {
    onMove({ [gamestate.next_to_play]: pos.x.toString() + pos.y.toString() });
  };

  return <GridBoard board={board} onClick={onClick} />;
}
