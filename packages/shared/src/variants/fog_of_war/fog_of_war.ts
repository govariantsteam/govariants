import { AbstractGame } from "../../abstract_game";
import { Coordinate } from "../../lib/coordinate";
import { examineGroup } from "../../lib/group_utils";
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
};

export class FogOfWar extends AbstractGame<NewGridBadukConfig, FogOfWarState> {
  board: FogOfWarBoard;
  private ko_detector = new SuperKoDetector();
  protected next_to_play: binaryPlayerNr = 0;

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

    return {
      board: this.board
        .map((field) => field.exportFor(typedPlayerNr))
        .serialize(),
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
        this.postValidateMove(position);
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

    const opponent_color = this.next_to_play === 0 ? Color.WHITE : Color.BLACK;
    this.board.neighbors(move).forEach((pos) => {
      const neighbor_color = this.board.at(pos)!.color;
      const { members: groupMembers, liberties: liberties } = examineGroup({
        index: pos,
        board: this.board,
        groupIdentifier: (field) => field.color === neighbor_color,
        libertyIdentifier: (field) => field.color === Color.EMPTY,
      });
      if (neighbor_color === opponent_color && liberties === 0) {
        groupMembers.forEach((pos) => this.board.removeStone(pos));
        //this.captures[this.next_to_play] += group.length;
      }
    });
  }

  protected postValidateMove(move: Coordinate): void {
    // TODO: Think about how Suicide and Ko should work with partial information.

    // Detect suicide
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
      members.forEach((pos) => this.board.removeStone(pos));

      adjacent.forEach((pos) =>
        this.board.at(pos)!.updateLKI(this.next_to_play),
      );
    }

    // situational superko
    this.ko_detector.push({
      board: this.board.map((x) => x.color).serialize(),
      next_to_play: this.next_to_play,
    });
  }

  protected prepareForNextMove(move: string): void {
    // if (move == "pass" && this.last_move === "pass") {
    //   this.finalizeScore();
    // } else {
    this.next_to_play = this.next_to_play === 0 ? 1 : 0;
    // }
    super.increaseRound();
  }
}

export const fogOfWarVariant: Variant<NewGridBadukConfig, FogOfWarState> = {
  gameClass: FogOfWar,
  defaultConfig: Baduk.defaultConfig,
  description: "Each stone casts a ray of light that illuminates fields.",
};
