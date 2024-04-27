import { AbstractBaduk } from "../../lib/abstractBaduk/abstractBaduk";
import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import { SuperKoDetector } from "../../lib/ko_detector";
import {
  BinaryColor,
  GraphBadukConfig,
  GraphBadukState,
  BadukStone,
  GraphBadukIntersection,
  GraphBadukKoState,
} from "./graph_baduk.types";

export class GraphBaduk extends AbstractBaduk<
  GraphBadukConfig,
  BinaryColor,
  BadukStone<BinaryColor>,
  GraphBadukState
> {
  captures = { 0: 0, 1: 0 };
  private ko_detector = new SuperKoDetector<GraphBadukKoState>();

  constructor(config?: GraphBadukConfig) {
    super(config);
  }

  defaultConfig(): GraphBadukConfig {
    return {
      board: { type: BoardPattern.Polygonal, size: 6 },
      komi: 6.5,
    };
  }

  private unpackColor(
    colorSet: Set<BinaryColor> | undefined,
  ): BinaryColor | null {
    if (colorSet === undefined) return null;
    return colorSet.has("black") ? "black" : "white";
  }

  private simpliedBoard(): GraphBadukState["board"] {
    return this.intersections.map((intersection) =>
      this.unpackColor(intersection.stone?.color),
    );
  }

  exportState(): GraphBadukState {
    return {
      komi: this.config.komi,
      board: this.simpliedBoard(),
      captures: {
        0: this.captures[0],
        1: this.captures[1],
      },
      round: this.round,
    };
  }

  protected handleResign(player: number): void {
    this.phase = "gameover";
    this.result = player === 0 ? "W+R" : "B+R";
    return;
  }

  protected handleTimeout(player: number): void {
    this.phase = "gameover";
    this.result = player === 0 ? "W+T" : "B+T";
  }

  playMove(player: number, move: string): void {
    if (move === "resign") {
      this.handleResign(player);
      return;
    }

    if (move === "timeout") {
      this.handleTimeout(player);
      return;
    }

    if (!this.nextToPlay().includes(player)) {
      throw Error(`It's not player ${player}'s turn!`);
    }

    if (move != "pass") {
      const intersectionId = Number(move);
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
    this.prepareForNextMove(player, move);
    super.increaseRound();
  }

  nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.round % 2];
  }

  numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  protected override removeChain(chain: Set<GraphBadukIntersection>): void {
    const color = Array.from(chain).at(0)?.stone?.color;
    if (color) {
      if (this.unpackColor(color) === "black") {
        this.captures[1] += chain.size;
      } else {
        this.captures[0] += chain.size;
      }
    } else {
      console.log(
        "potential implementation error: unable to identify color of chain",
      );
    }

    super.removeChain(chain);
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

    this.checkForKo();
  }

  // eslint-disable-next-line
  protected prepareForNextMove(player: number, move: string): void {}

  protected checkForKo(): void {
    const koState: GraphBadukKoState = {
      board: this.simpliedBoard(),
      nextToPlay: this.nextToPlay().at(0),
    };
    this.ko_detector.push(koState);
  }
}
