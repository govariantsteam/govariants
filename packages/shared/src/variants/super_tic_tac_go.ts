import { 
    Baduk, 
    BadukConfig,
    badukVariant,
    Color,
} from "./baduk";
import { superTicTacGoRules } from "../templates/super_tic_tac_go_rules";
import { NewBadukConfig, NewGridBadukConfig } from "./baduk_utils";
import { BoardPattern } from "../lib/abstractBoard/boardFactory";
import { Coordinate, CoordinateLike } from "../lib/coordinate";

// Each of the 9 3x3 subgrids on the 9x9 Super Tic-Tac-Go boards
class Nonant {
    /**
     * X and Y specify which nonant - 0-index, from top-left. 
     * @param x 0 | 1 | 2
     * @param y 0 | 1 | 2
     */
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) {
        // there must bea better way 
        // to specify range in typescript than this...
        if (x < 0 || x > 2 || y < 0 || y > 2) {
            throw new Error (`${[x,y]} disallowed nonant section`);
        }
    }

    /**
     * Get an array of all the coordinates in this nonant.
     * @returns Array of Coordinate objects
     */
    vertices(): Array<Coordinate> {
        const x = this.x * 3, y = this.y * 3;
        return [
            new Coordinate(x,y),
            new Coordinate(x,y+1),
            new Coordinate(x,y+2),
            new Coordinate(x+1,y),
            new Coordinate(x+1,y+1),
            new Coordinate(x+1,y+2),
            new Coordinate(x+2,y),
            new Coordinate(x+2,y+1),
            new Coordinate(x+2,y+2),
        ];
    }

    /**
     * Checks whether a given coordinate is in this nonant.
     * @param coord 
     * @returns true of coord is in this, false otherwise
     */
    has(coord: CoordinateLike): boolean {
        return coord.x >= this.x * 3
            && coord.x < this.x * 3 + 3
            && coord.y >= this.y * 3
            && coord.y < this.y * 3 + 3;
    }

    equals(other: Nonant) {
        return this.x === other.x && this.y === other.y;
    }

    // this function is the reason i couldn't set x and y to require 0-2.
    // i couldn't find a way to make coord.x % 3 type-safe, such that
    // vscode didn't warn me about it
    /**
     * After a move is played, use this to find the next legal nonant.
     * @param coord 
     * @returns the nonant that corresponds to a given coordinate.
     */
    static correspondingToCoordinate(coord: CoordinateLike): Nonant {
        return new Nonant(coord.x % 3, coord.y % 3);
    }
}

export class SuperTicTacGo extends Baduk {
    constructor(config: BadukConfig) {
        super(SuperTicTacGo.sanitizeConfig(config));
    }

    override playMove(player: number, move: string): void {
        // move.length === 2 is checking to make sure it's not a 'special' move
        // i should use a better move type checker for this
        if (move.length === 2 && this.last_move.length === 2) {
            const coordinate = super.decodeMove(move);
            const targetNonant = this.getLegalNonant();
            if (
                !targetNonant.has(coordinate) 
                && this.hasOpenPoints(targetNonant)
            ) {
                throw new Error (`${move} out of range of legal nonant`);
            }
        }
    
        super.playMove(player, move);
    }

    
    override postValidateMove(): void {
        // Allow self-capture moves
        // allow  ko
    }

    override prepareForNextMove(move: string): void {
        if (move === 'pass') this.captures[this.next_to_play > 0 ? 0 : 1];
        super.prepareForNextMove(move);
    }

    protected getLegalNonant(): Nonant {
        const lastMove = super.decodeMove(this.last_move);
        return Nonant.correspondingToCoordinate(lastMove);
    }

    protected getOpenVerticesInNonant(nonant: Nonant): Array<Coordinate> {
        return nonant.vertices().filter((coord) => {
            return this.board.at(coord) === Color.EMPTY;
        });
    }

    protected hasOpenPoints(nonant: Nonant): boolean {
        return this.getOpenVerticesInNonant(nonant).length > 0;
    }

    static defaultConfig(): NewGridBadukConfig {
        return {
            komi: 0,
            board: {
                type: BoardPattern.Grid,
                width: 9,
                height: 9,
            },
        };
    }

    static sanitizeConfig(config: unknown): NewBadukConfig {
        // I should define a new config type, 
        // and get rid of ...Baduk.sanitizeConfig
        return {
            ...Baduk.sanitizeConfig(config),
            board: {
                type: "grid",
                width: 9,
                height: 9,
            }
        };
    }
}

export const superTicTacGoVariant: typeof badukVariant = {
    ...badukVariant,
    gameClass: SuperTicTacGo,
    description: 
        'Baduk with a twist inspired by the "tic-tac-toe" variant "Super Tic-Tac-Toe"!',
    rulesDescription: superTicTacGoRules.trim(),
    defaultConfig: SuperTicTacGo.defaultConfig,
    sanitizeConfig: SuperTicTacGo.sanitizeConfig,
};