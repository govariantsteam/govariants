import { AbstractGame } from "../abstract_game";
import { BoardPattern } from "../lib/abstractBoard/boardFactory";
import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Baduk, BadukBoard, BadukConfig, Color } from "./baduk";
import {
  NewBadukConfig,
  NewGridBadukConfig,
  getWidthAndHeight,
  isGridBadukConfig,
  isLegacyBadukConfig,
  mapToNewConfig,
} from "./baduk_utils";

export interface QuantumGoState {
  // length=2
  // two go boards
  boards: Color[][][];
  // length=0..2, in order of initial placement
  quantum_stones: string[];
}

/** helper class to make interactions with the Baduk instances easier */
class BadukHelper {

  public badukGame: Baduk;

  constructor(config: BadukConfig) {
    this.badukGame = new Baduk(config);
  }

  pass(player: number) {
    this.badukGame.playMove(player, "pass");
  }

  play(player: number, move: string): Coordinate[] {
    const subgame = this.badukGame;
    const prevBoard = copyBoard(subgame);
    subgame.playMove(player, move);
    const captures = deduceCaptures(prevBoard, subgame.board);

    return captures;
  }

  clear(group: CoordinateLike[]) {
    for (const pos of group) {
      this.badukGame.board.set(pos, Color.EMPTY);
    }
  }
}

export class QuantumGo extends AbstractGame<NewBadukConfig, QuantumGoState> {

 
  subgames: BadukHelper[] = [];
  quantum_stones: Coordinate[] = [];
  
  private sgfContent: string = '';

  constructor(config: BadukConfig) {
    super(isLegacyBadukConfig(config) ? mapToNewConfig(config) : config);
    
    if (isGridBadukConfig(this.config)) {
      const {width , height} = getWidthAndHeight(this.config);
      this.makeSGFHeader("player Black","player white", `${width}:${height}`, config.komi);
    }
  }

  private decodeMove(move: string): Coordinate {
    if (isGridBadukConfig(this.config)) {
      return Coordinate.fromSgfRepr(move);
    }
    // graph boards encode moves with the unique identifier number
    return new Coordinate(Number(move), 0);
  }

  private encodeMove(pos: Coordinate): string {
    if (isGridBadukConfig(this.config)) {
      return pos.toSgfRepr();
    }
    return pos.x.toString();
  }
  
  playMove(player: number, move: string): void {
    if (move === "resign") {
      this.phase = "gameover";
      this.result = player === 0 ? "B+R" : "W+R";
      return;
    }

    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "B+T" : "W+T";
      return;
    }

    if (move === "pass") {
      if (this.subgames.length === 0) {
        throw new Error(
          "Please, don't pass during the quantum stone placement phase",
        );
      }
      this.subgames.forEach((game) => game.pass(player));
      if (this.subgames[0].badukGame.phase === "gameover") {
        this.phase = "gameover";
        const getResult = (board: number) =>
          this.subgames[board].badukGame.numeric_result ?? 0;
        const numeric_result = getResult(0) + getResult(1) - this.config.komi;
        if (numeric_result < 0) {
          this.result = `W+${-numeric_result}`;
        } else if (numeric_result > 0) {
          this.result = `B+${numeric_result}`;
        } else {
          this.result = "Tie";
        }
      }
      return;
    }

    const pos = this.decodeMove(move);
    // TODO: add a Dimensions class (#216) and look at that instead of
    // building a grid for no reason
    if (
      !new BadukHelper({ ...this.config, komi: 0 }).badukGame.board.isInBounds(
        pos,
      )
    ) {
      throw new Error("Out of bounds!");
    }

    switch (this.round) {
      case 0: {
        if (player !== 0) {
          throw new Error("Black must place the first quantum stone.");
        }
        this.quantum_stones.push(pos);
       
        break;
      }
      case 1: {
        if (player !== 1) {
          throw new Error("White must place the second quantum stone.");
        }
        this.quantum_stones.push(pos);

        this.subgames = [
          // komi is 0 so that it's easier to use the result of the subgames to
          // build our final score
          new BadukHelper({ ...this.config, komi: 0 }),
          new BadukHelper({ ...this.config, komi: 0 }),
        ];
        // We can assume this exists because it is filled in the first round.
        const first = this.encodeMove(this.quantum_stones[0]);
        // move 0
        this.subgames[0].play(0, first);
        this.subgames[1].play(0, move);
        // move 1
        this.subgames[0].play(1, move);
        this.subgames[1].play(1, first);
        break;
      }
      default: {
        let moves: [Coordinate, Coordinate];
        if (this.quantum_stones.find((stone) => stone.equals(pos))) {
          switch (player) {
            case 0:
              moves = [this.quantum_stones[0], this.quantum_stones[1]];
              break;
            case 1:
              moves = [this.quantum_stones[1], this.quantum_stones[0]];
              break;
          }
        } else {
          moves = [pos, pos];
        }
        const quantum_captures = this.subgames.map((game, idx) =>
          game
            .play(player, this.encodeMove(moves[idx]))
            .map(this.mappedCapture.bind(this)),
        );
        this.subgames[0].clear(quantum_captures[1]);
        this.subgames[1].clear(quantum_captures[0]);
      }
    }
    this.writeToSGF(move, player);

    super.increaseRound();
  }

  exportState(): QuantumGoState {
    if (!this.subgames.length) {
      const makeBoardWithStone = (
        pos: Coordinate | undefined,
        color: Color,
      ) => {
        const board = new BadukHelper({ ...this.config, komi: 0 }).badukGame
          .board;
        if (pos != null) {
          board.set(pos, color);
        }
        return board.serialize();
      };
      const first = this.quantum_stones[0];
      return {
        boards: [
          makeBoardWithStone(first, Color.BLACK),
          makeBoardWithStone(first, Color.WHITE),
        ],
        quantum_stones: this.quantum_stones.map((pos) => pos.toSgfRepr()),
      };
    }

    return {
      boards: this.subgames.map((game) => game.badukGame.board.serialize()),
      quantum_stones: this.quantum_stones.map((pos) => pos.toSgfRepr()),
    };
  }
  nextToPlay(): number[] {
    if (this.phase === "gameover") {
      return [];
    }
    return [this.round % 2];
  }
  numPlayers(): number {
    return 2;
  }
  defaultConfig(): NewGridBadukConfig {
    return {
      board: { type: BoardPattern.Grid, width: 9, height: 9 },
      komi: 7.5,
    };
  }

  specialMoves(): { [key: string]: string } {
    return new Baduk().specialMoves();
  }

  /* returns position on the other board */
  mappedCapture(pos: Coordinate): Coordinate {
    const idx = this.quantum_stones.findIndex((qpos) => qpos.equals(pos));
    switch (idx) {
      case -1:
        // not quantum
        return pos;
      case 0:
        return this.quantum_stones[1];
      case 1:
        return this.quantum_stones[0];
    }
    throw new Error("Error finding mapped capture.");
  }


  public makeSGFHeader(playerB: string, playerW: string, boardSize: string, komi: number){
      
    this.sgfContent += 

    "(;\n" +
    "EV[GO Variants]\n" +
    `PB[${playerB}]\n` +
    `PW[${playerW}]\n` +
    `SZ[${boardSize}]\n` +
    `KM[${komi}]\n` +   
    "VS[quantum]\n" +
    "\n"
    ;
    
  }
  
  //writing to sgf file
  private writeToSGF(text: string, player: number){
   
    this.sgfContent += `${player % 2 === 0 ? ";B" : ";W"}[${text}]`;
    
  }

  getSGF(): string {
    if (!isGridBadukConfig(this.config)) {
      // SGF for non rectangular boards is not possible
      return "non-rectangular";
    }
    return this.sgfContent;
  }
  
}


/** based on two board states, determine which stones were captured */
function deduceCaptures(
  prevBoard: BadukBoard<Color>,
  currBoard: BadukBoard<Color>,
): Coordinate[] {
  const captures: Coordinate[] = [];
  prevBoard.forEach((color, coordinate) => {
    if (color !== Color.EMPTY && currBoard.at(coordinate) === Color.EMPTY) {
      captures.push(new Coordinate(coordinate.x, coordinate.y));
    }
  });

  return captures;
}

/** Make a copy of the game's board */
function copyBoard(game: Baduk): BadukBoard<Color> {
  return game.board.map((color) => color);
}
