import { Coordinate, type CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { AbstractGame } from "../abstract_game";
import { Variant } from "../variant";
import { getGroup, getOuterBorder, examineGroup } from "../lib/group_utils";

type Color = 0 | 1 | null;

export interface RizomaBoardConfig {
  width: number;
  height: number;
  komi: number;
}

export interface RizomaConfig {
  boards: RizomaBoardConfig[];
  global_komi: number;
}

export interface BoardScore {
  black_territory: number;
  white_territory: number;
  komi: number;
  komi_recipient: 0 | 1 | null;
}

export interface RizomaState {
  boards: Color[][][];
  pending_transfers: number;
  transfer_source_board: number;
  first_move_on_board: (0 | 1 | null)[];
  ko_board: number;
  ko_point: ({ x: number; y: number } | null)[];
  ko_forbidden_player: number;
  board_scores?: BoardScore[];
}

export class Rizoma extends AbstractGame<RizomaConfig, RizomaState> {
  public boards: Grid<Color>[];
  protected next_to_play: 0 | 1 = 0;
  private pending_transfers: number = 0;
  private transfer_source_board: number = -1;
  private first_move_on_board: (0 | 1 | null)[];
  private consecutive_passes: number = 0;
  private ko_point: (CoordinateLike | null)[];
  private ko_board: number = -1;
  // Which player is forbidden from immediately recapturing. -1 = no restriction.
  private ko_forbidden_player: -1 | 0 | 1 = -1;
  private board_scores: BoardScore[] = [];

  constructor(config: RizomaConfig) {
    super(config);
    const boardConfigs = this.config.boards;
    if (boardConfigs.length < 2)
      throw new Error("Rizoma requires at least 2 boards");
    if (boardConfigs.length > 5)
      throw new Error("Rizoma supports at most 5 boards");
    for (const b of boardConfigs) {
      if (b.width >= 20 || b.height >= 20) throw new Error("Board too big!");
    }
    this.boards = boardConfigs.map((b) =>
      new Grid<Color>(b.width, b.height).fill(null),
    );
    this.first_move_on_board = boardConfigs.map(() => null);
    this.ko_point = boardConfigs.map(() => null);
  }

  override exportState(): RizomaState {
    return {
      boards: this.boards.map((b) => b.to2DArray()),
      pending_transfers: this.pending_transfers,
      transfer_source_board: this.transfer_source_board,
      first_move_on_board: [...this.first_move_on_board],
      ko_board: this.ko_board,
      ko_point: this.ko_point.map((k) => (k ? { x: k.x, y: k.y } : null)),
      ko_forbidden_player: this.ko_forbidden_player,
      board_scores:
        this.board_scores.length > 0 ? this.board_scores : undefined,
    };
  }

  override nextToPlay(): number[] {
    if (this.phase === "gameover") return [];
    return [this.next_to_play];
  }

  override playMove(player: number, move: string): void {
    if (player !== this.next_to_play) {
      throw new Error(`It is not player ${player}'s turn`);
    }

    if (move === "resign") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+R" : "B+R";
      return;
    }
    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+T" : "B+T";
      return;
    }

    if (move === "keep_prisoners") {
      // Forfeit bonus moves; captured stones remain as scoring prisoners.
      // Does NOT count as a pass for the double-pass game-end rule.
      this.pending_transfers = 0;
      this.transfer_source_board = -1;
      this.switchPlayer();
      super.increaseRound();
      return;
    }

    if (move === "pass") {
      this.consecutive_passes++;
      if (this.consecutive_passes >= 2) {
        this.phase = "gameover";
        this.result = this.calculateResult();
      } else {
        this.switchPlayer();
      }
      super.increaseRound();
      return;
    }

    const parts = move.split(":");
    if (parts.length !== 2)
      throw new Error("Invalid move format: use boardIndex:sgfCoord");
    const boardIndex = parseInt(parts[0]);
    const coord = Coordinate.fromSgfRepr(parts[1]);

    if (boardIndex < 0 || boardIndex >= this.boards.length)
      throw new Error("Invalid board index");
    if (this.pending_transfers > 0 && boardIndex === this.transfer_source_board)
      throw new Error("Cannot transfer to the board where capture occurred");

    const board = this.boards[boardIndex];
    if (!board.isInBounds(coord)) throw new Error("Move out of bounds");
    if (board.at(coord) !== null) throw new Error("Position already occupied");

    // Ko check: only the designated forbidden player is restricted.
    if (
      player === this.ko_forbidden_player &&
      this.ko_board === boardIndex &&
      this.ko_point[boardIndex] &&
      coord.x === this.ko_point[boardIndex]!.x &&
      coord.y === this.ko_point[boardIndex]!.y
    ) {
      throw new Error("Ko rule violation");
    }

    // The restricted player has played a valid move — lift the ko restriction.
    // Any new ko from this move will be set by processCaptures below.
    if (player === this.ko_forbidden_player) {
      this.ko_board = -1;
      this.ko_forbidden_player = -1;
    }

    board.set(coord, player as Color);
    this.consecutive_passes = 0;

    if (this.first_move_on_board[boardIndex] === null) {
      this.first_move_on_board[boardIndex] = player as 0 | 1;
    }

    const captured = this.processCaptures(
      boardIndex,
      coord,
      (1 - player) as 0 | 1,
    );

    if (this.pending_transfers > 0) {
      this.pending_transfers--;
      if (captured > 0) {
        this.pending_transfers += captured;
        this.transfer_source_board = boardIndex;
      }
      if (this.pending_transfers === 0) {
        this.transfer_source_board = -1;
        this.switchPlayer();
      }
    } else {
      if (captured > 0) {
        this.pending_transfers = captured;
        this.transfer_source_board = boardIndex;
      } else {
        this.switchPlayer();
      }
    }

    super.increaseRound();
  }

  private switchPlayer(): void {
    this.next_to_play = (1 - this.next_to_play) as 0 | 1;
  }

  private processCaptures(
    boardIndex: number,
    lastMove: Coordinate,
    opponent: 0 | 1,
  ): number {
    const board = this.boards[boardIndex];
    let totalCaptured = 0;

    for (const neighbor of board.neighbors(lastMove)) {
      if (board.at(neighbor) !== opponent) continue;
      const { members, liberties } = examineGroup({
        index: neighbor,
        board,
        groupIdentifier: (v) => v === opponent,
        libertyIdentifier: (v) => v === null,
      });
      if (liberties === 0) {
        members.forEach((stone) => board.set(stone, null));
        totalCaptured += members.length;
        if (members.length === 1) {
          // Single-stone capture: set ko. The opponent (whose stone was taken)
          // is forbidden from immediately recapturing this position.
          this.ko_point[boardIndex] = members[0];
          this.ko_board = boardIndex;
          this.ko_forbidden_player = opponent;
        } else {
          // Multi-stone capture: no ko. Clear any ko that was on this board.
          this.ko_point[boardIndex] = null;
          if (this.ko_board === boardIndex) {
            this.ko_board = -1;
            this.ko_forbidden_player = -1;
          }
        }
      }
    }

    const playerColor = board.at(lastMove);
    if (playerColor !== null && playerColor !== undefined) {
      const { liberties: ownLiberties } = examineGroup({
        index: lastMove,
        board,
        groupIdentifier: (v) => v === playerColor,
        libertyIdentifier: (v) => v === null,
      });
      if (ownLiberties === 0) throw new Error("Suicide move not allowed");
    }

    return totalCaptured;
  }

  private calculateResult(): string {
    let totalBlack = 0;
    let totalWhite = 0;
    this.board_scores = [];
    for (let i = 0; i < this.boards.length; i++) {
      const { komi } = this.config.boards[i];
      const t = this.countTerritory(this.boards[i]);
      const firstMove = this.first_move_on_board[i];
      // Second opener on each board receives that board's komi.
      const komi_recipient: 0 | 1 | null =
        firstMove === 0 ? 1 : firstMove === 1 ? 0 : null;
      this.board_scores.push({
        black_territory: t.black,
        white_territory: t.white,
        komi,
        komi_recipient,
      });
      totalBlack += t.black;
      totalWhite += t.white;
      if (komi_recipient === 0) totalBlack += komi;
      else if (komi_recipient === 1) totalWhite += komi;
    }
    // Global komi: fixed addition to White to prevent draws.
    totalWhite += this.config.global_komi;
    if (totalBlack > totalWhite) return `B+${totalBlack - totalWhite}`;
    if (totalWhite > totalBlack) return `W+${totalWhite - totalBlack}`;
    return "Draw";
  }

  private countTerritory(board: Grid<Color>): { black: number; white: number } {
    const visited = new Set<string>();
    let black = 0;
    let white = 0;
    board.forEach((val, coord) => {
      if (val !== null) return;
      const key = `${coord.x},${coord.y}`;
      if (visited.has(key)) return;
      const region = getGroup(coord, board);
      region.forEach((c) => visited.add(`${c.x},${c.y}`));
      const borderColors = new Set(
        getOuterBorder(region, board)
          .map((c) => board.at(c))
          .filter((v): v is 0 | 1 => v !== null && v !== undefined),
      );
      if (borderColors.size === 1) {
        const owner = [...borderColors][0];
        if (owner === 0) black += region.length;
        else if (owner === 1) white += region.length;
      }
    });
    return { black, white };
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return this.pending_transfers > 0
      ? { keep_prisoners: "Keep prisoners", resign: "Resign" }
      : { pass: "Pass", resign: "Resign" };
  }
}

export const RizomaVariant: Variant<RizomaConfig, RizomaState> = {
  gameClass: Rizoma,
  description:
    "A multi-board Go variant with capture transfer. Each turn, place a stone on any board. After a capture, keep prisoners for scoring or redeploy them as bonus moves on another board.",
  rulesDescription: `Rizoma is a multi-board Go variant where strategy flows across interconnected fronts.

## Setup

Two or more boards are played simultaneously. The default configuration uses two 7×7 boards, but boards can be of different sizes to create asymmetry between fronts.

## Gameplay

Each turn, a player places one stone on any board of their choice. Standard Go rules apply on each board independently, including the ko rule.

## Capture Transfer

After capturing stones, the capturing player faces a choice:

- **Keep** the captured stones as prisoners for end-game scoring
- **Redeploy** them as bonus moves on any other board — excluding the board where the capture occurred. Redeployed stones are played in the capturing player's own color and are not counted as prisoners.

## Dynamic Komi

Komi is not fixed. Instead, the second player to place a stone on each board receives the komi points for that board. This rewards the player who responds on a new front rather than opening it.

## Global Komi (optional)

An optional global komi of 0.5 points can be assigned to White at game setup. This is recommended when playing with an even number of boards, where dynamic komi alone may not prevent draws.

## Scoring

Territory is counted across all boards and summed. Dynamic komi is added per board. Global komi is added to White. The player with the highest total wins.`,
  time_handling: "sequential",
  defaultConfig(): RizomaConfig {
    return {
      boards: [
        { width: 7, height: 7, komi: 0 },
        { width: 7, height: 7, komi: 0 },
      ],
      global_komi: 0.5,
    };
  },
  getPlayerColors(_config: RizomaConfig, playerNr: number): string[] {
    return playerNr === 0 ? ["black"] : ["white"];
  },
  movePreview(
    config: RizomaConfig,
    state: RizomaState,
    move: string,
    player: number,
  ): RizomaState {
    if (
      move === "pass" ||
      move === "keep_prisoners" ||
      move === "resign" ||
      move === "timeout"
    )
      return state;
    const parts = move.split(":");
    if (parts.length !== 2) return state;
    const boardIndex = parseInt(parts[0]);
    if (
      isNaN(boardIndex) ||
      boardIndex < 0 ||
      boardIndex >= config.boards.length
    )
      return state;
    const coord = Coordinate.fromSgfRepr(parts[1]);
    const boards = state.boards.map((b) => b.map((row) => [...row]));
    if (!boards[boardIndex] || boards[boardIndex][coord.y]?.[coord.x] !== null)
      return state;
    boards[boardIndex][coord.y][coord.x] = player as 0 | 1;
    return { ...state, boards };
  },
};
