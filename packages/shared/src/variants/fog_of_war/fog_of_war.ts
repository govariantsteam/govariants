import { AbstractGame } from "../../abstract_game";
import { Coordinate, CoordinateLike } from "../../lib/coordinate";
import { Grid } from "../../lib/grid";
import { examineGroup, getGroup, getOuterBorder } from "../../lib/group_utils";
import { SuperKoDetector } from "../../lib/ko_detector";
import { Variant } from "../../variant";
import { Baduk, Color } from "../baduk";
import { NewGridBadukConfig } from "../baduk_utils";
import {
  binaryPlayerNr,
  VisibleField,
  FogOfWarBoard,
  FogOfWarField,
} from "./fog_of_war.types";

export type FogOfWarState = {
  board: VisibleField[][];
  score_board?: Color[][];
};

export class FogOfWar extends AbstractGame<NewGridBadukConfig, FogOfWarState> {
  board: FogOfWarBoard;
  private ko_detector = new SuperKoDetector();
  protected score_board?: Grid<Color>;
  protected next_to_play: binaryPlayerNr = 0;
  protected last_move = "";

  constructor(config: NewGridBadukConfig) {
    super(config);

    if (this.config.board.width >= 52 || this.config.board.height >= 52) {
      throw new Error(
        "Rectangular board does not support sizes greater than 52",
      );
    }

    this.board = new FogOfWarBoard(config.board.width, config.board.height);
  }

  override exportState(player?: number): FogOfWarState {
    const typedPlayerNr: binaryPlayerNr | null =
      player === 0 || player === 1 ? player : null;
    const isGameOver = this.phase === "gameover";

    return {
      board: this.board
        .map((field) => field.exportFor(typedPlayerNr, isGameOver))
        .serialize(),
      ...(this.score_board && { score_board: this.score_board.serialize() }),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.next_to_play];
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  override playMove(player: number, move: string): void {
    if (!(player === 0 || player === 1)) {
      throw Error("unexpected player param");
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

    if (!this.nextToPlay().includes(player)) {
      throw Error(`It's not player ${player}'s turn.`);
    }

    if (move !== "pass") {
      const position = Coordinate.fromSgfRepr(move);

      if (!this.board.isInBounds(position)) {
        throw Error(`Move out of bounds. (move: ${position})`);
      }

      const field = this.board.at(position)!;
      if (field.color === Color.EMPTY) {
        this.playMoveInternal(position);
        this.postValidateMove();
      } else {
        this.handleCollision(field);
      }
    }
    this.prepareForNextMove(move);
  }

  handleCollision(field: FogOfWarField): void {
    if (field.isVisibleTo(this.next_to_play)) {
      throw Error(`Cannot place a stone on top of an existing stone.`);
    } else {
      field.updateLKI(this.next_to_play);
    }
  }

  protected playMoveInternal(move: Coordinate): void {
    this.board.addStone(this.next_to_play, move);

    // Resolve opponent captures
    const opponent_color = this.next_to_play === 0 ? Color.WHITE : Color.BLACK;
    this.board.neighbors(move).forEach((pos) => {
      const neighbor_color = this.board.at(pos)!.color;
      if (neighbor_color !== opponent_color) {
        return;
      }
      const {
        members: members,
        adjacent: adjacent,
        liberties: liberties,
      } = examineGroup({
        index: pos,
        board: this.board,
        groupIdentifier: (field) => field.color === neighbor_color,
        libertyIdentifier: (field) => field.color === Color.EMPTY,
      });
      if (liberties === 0) {
        this.removeGroup(members, adjacent, true);
      }
    });

    // Resolve self capture
    const move_color = this.next_to_play === 0 ? Color.BLACK : Color.WHITE;
    const {
      members: members,
      adjacent: adjacent,
      liberties: liberties,
    } = examineGroup({
      index: move,
      board: this.board,
      groupIdentifier: (field) => field.color === move_color,
      libertyIdentifier: (field) => field.color === Color.EMPTY,
    });
    if (liberties === 0) {
      this.removeGroup(members, adjacent, false);
    }

    this.board.updateLKIs();
  }

  private removeGroup(
    members: CoordinateLike[],
    adjacent: CoordinateLike[],
    isOpponentGroup: boolean,
  ): void {
    const owner = isOpponentGroup
      ? this.next_to_play === 0
        ? 1
        : 0
      : this.next_to_play;
    members.forEach((pos) => this.board.removeStone(pos));

    // when a group is removed, its owner gets knowledge of surrounding stones.
    adjacent.forEach((pos) => this.board.at(pos)!.updateLKI(owner));

    // unless this is a stone that immediately gets captured, we know that all players
    // and thus also observer, have visibility on the captured group.
    if (isOpponentGroup || members.length > 1) {
      [...members, ...adjacent].forEach((pos) =>
        this.board.at(pos)!.updateLKI(null),
      );
    }
  }

  protected postValidateMove(): void {
    // situational superko
    this.ko_detector.push({
      board: this.board.map((x) => x.color).serialize(),
      next_to_play: this.next_to_play,
    });
  }

  protected prepareForNextMove(move: string): void {
    if (move == "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      this.next_to_play = this.next_to_play === 0 ? 1 : 0;
      this.last_move = move;
    }
    super.increaseRound();
  }

  private finalizeScore(): void {
    const board = this.board.map((x) => x.color);
    const visited = this.board.map(() => false);
    let black_points = 0;
    let white_points = this.config.komi;

    board.forEach((color, pos) => {
      if (visited.at(pos)) {
        return;
      }
      if (color === Color.EMPTY) {
        const group = getGroup(pos, board);
        const outer_border = getOuterBorder(group, board);
        const border_colors = outer_border.map((pos) => board.at(pos) as Color);
        if (border_colors.length > 0) {
          const owner_color = border_colors[0];
          if (border_colors.every((c) => c === owner_color)) {
            group.forEach((pos) => board.set(pos, owner_color));
          }
        }
        group.forEach((pos) => visited.set(pos, true));
      }
    });

    board.forEach((color) => {
      if (color === Color.BLACK) black_points++;
      else if (color === Color.WHITE) white_points++;
    });

    this.score_board = board;

    const diff = black_points - white_points;
    if (diff < 0) {
      this.result = `W+${-diff}`;
    } else if (diff > 0) {
      this.result = `B+${diff}`;
    } else {
      this.result = "Tie";
    }

    this.phase = "gameover";
  }
}

export const fogOfWarVariant: Variant<NewGridBadukConfig, FogOfWarState> = {
  gameClass: FogOfWar,
  defaultConfig: Baduk.defaultConfig,
  description: "Each stone casts a ray of light that illuminates fields.",
};
