import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { AbstractGame } from "../abstract_game";

// 0 will represent X, 1 will represent O
type Color = number | null;

export interface TicTacToeState {
  board: Color[][];
}

export class TicTacToe extends AbstractGame<object, TicTacToeState> {
  public board: Grid<number | null>;
  protected next_to_play: 0 | 1 = 0;

  // Initialize state of the game for a given config
  constructor(config?: object) {
    // AbstractGame will set this.config to the defaultConfig() if config is undefined.
    // Therefore, we access config through this.config in the rest of this function
    super(config);

    // Usually, we would validate some config properties, but we will not
    // worry about making Tic-Tac-Toe configurable.

    // Tic-Tac-Toe is played on a 3x3 grid
    this.board = new Grid<Color>(3, 3).fill(null);
  }

  // Return an object that represents the state of the game as it should be displayed to
  // the user.  The player parameter can be used to determine which parts of the state
  // should not be shown.
  override exportState(/* player?: number */): TicTacToeState {
    return {
      board: this.board.to2DArray(),
    };
  }

  // Return an array of the players who can place a stone in this round
  override nextToPlay(): number[] {
    // Return empty array if game is over.
    // You can check the phase property of AbstractGame
    if (this.phase === "gameover") {
      return [];
    }

    // Return a list of the players who may submit a move
    // [0, 1] means either player can make a move - you will likely want to change this
    return [0, 1];
  }

  // Validate move and update the state accordingly
  override playMove(player: number, move: string): void {
    if (move === "resign") {
      // Set phase to "gameover" to end the game
      // phase is a property of the AbstractGame class
      this.phase = "gameover";
      // result is also a property of the AbstractGame class, and is displayed to the user
      this.result = this.next_to_play === 0 ? "W+R" : "B+R";
      return;
    }

    if (move === "timeout") {
      // "timeout" is a special move sent by the system, and is handled similar
      // "resign"
      this.phase = "gameover";
      this.result = player === 0 ? "W+T" : "B+T";
      return;
    }

    if (move == "pass") {
      // It is important to increase the round in order for game playback
      // and timers to work
      super.increaseRound();
      return;
    }

    const decoded_move = Coordinate.fromSgfRepr(move);
    if (!this.board.isInBounds(decoded_move)) {
      // You can throw from the playMove() function to signify invalid moves
      throw Error(`Move out of bounds. (move: ${decoded_move})`);
    }

    // After checking the move is valid
    this.board.set(decoded_move, player);

    // It is important to increase the round in order for game playback
    // and timers to work
    super.increaseRound();
  }

  override numPlayers(): number {
    return 2;
  }

  // These show up as buttons in the UI
  // The key is the string that is passed to playMove(), and the value is
  // the string that is displayed on the button
  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  defaultConfig(): object {
    return {};
  }
}
