import { AbstractBaduk } from "../../lib/abstractBaduk/abstractBaduk";
import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import {
  BinaryColor,
  GraphBadukConfig,
  GraphBadukState,
  BadukStone,
  GraphBadukIntersection,
} from "./graph_baduk.types";

export class GraphBaduk extends AbstractBaduk<
  GraphBadukConfig,
  BinaryColor,
  BadukStone<BinaryColor>,
  GraphBadukState
> {
  private moves: string[] = [];

  constructor(config?: GraphBadukConfig) {
    super(config);
  }

  defaultConfig(): GraphBadukConfig {
    return {
      board: { type: BoardPattern.Polygonal, size: 6 },
      komi: 6.5,
    };
  }

  exportState(): GraphBadukState {
    return {
      moves: this.moves,
    };
  }

  playMove(player: number, move: string): void {
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
      throw Error(`It's not player ${player}'s turn!`);
    }

    if (move != "pass") {
      // TODO: properly decode intersectionId from move
      const intersectionId = 0;
      const intersection = this.intersections.find(
        (x) => x.id === intersectionId,
      );
      if (!intersection) {
        throw new Error("Move is out of bounds.");
      }
      if (intersection.stone) {
        throw Error(`Cannot place a stone on top of an existing stone.`);
      }

      this.playMoveInternal(player, intersection);
      this.postValidateMove(intersection);
    }
    this.moves.push(move);
    this.prepareForNextMove(move);
    super.increaseRound();
  }

  nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.moves.length % 2];
  }

  numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  protected playMoveInternal(
    player: number,
    intersection: GraphBadukIntersection,
  ): void {
    intersection.stone = new BadukStone<BinaryColor>(
      player === 0 ? "black" : "white",
    );
    this.removeChains();
  }

  protected postValidateMove(intersection: GraphBadukIntersection): void {
    if (!intersection.stone) {
      throw new Error("Self capture is not allowed.");
    }

    // TODO: Ko Detector
  }

  protected prepareForNextMove(move: string): void {}
}
