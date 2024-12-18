import { Coordinate, CoordinateLike } from "../../lib/coordinate";
import { Grid } from "../../lib/grid";
import { Color } from "../baduk";

const colorMap: { [p: number]: Color } = {
  0: Color.BLACK,
  1: Color.WHITE,
};

export class LighthouseField {
  private _color: Color = Color.EMPTY;
  // marks whether something was updated, for the purpose of LKI.
  updated: boolean = false;
  visibleFrom: (binaryPlayerNr | null)[] = [null, null, null, null];
  lastKnownInformation: Color[] = [Color.EMPTY, Color.EMPTY, Color.EMPTY];

  isVisibleToPlayer(playerNr: binaryPlayerNr): boolean {
    return (
      this.color === colorMap[playerNr] ||
      this.visibleFrom.some((x) => x === playerNr)
    );
  }

  isVisibleToPlayerFromDirection(
    playerNr: binaryPlayerNr,
    fromDirection: Direction,
  ): boolean {
    return (
      this.color === colorMap[playerNr] ||
      this.visibleFrom[fromDirection] === playerNr
    );
  }

  // Here we need to be careful not to reveal information to the players.
  // Observers may only see public information.
  isVisibleToObserver(): boolean {
    const directions: Direction[] = [0, 1, 2, 3];
    return directions.some(
      (direction) =>
        this.isVisibleToPlayerFromDirection(0, direction) &&
        this.isVisibleToPlayerFromDirection(1, opposite(direction)),
    );
  }

  isVisibleTo(person: binaryPlayerNr | null): boolean {
    return person === null
      ? this.isVisibleToObserver()
      : this.isVisibleToPlayer(person);
  }

  exportFor(person: binaryPlayerNr | null, isGameOver: boolean): VisibleField {
    return isGameOver
      ? { visibleColor: this.color, lastKnownInformation: Color.EMPTY }
      : {
          visibleColor: this.isVisibleTo(person) ? this.color : null,
          lastKnownInformation: this.lastKnownInformation[person ?? 2],
        };
  }

  setVisibleFrom(direction: Direction, player: binaryPlayerNr | null): void {
    this.visibleFrom[direction] = player;
    this.updated = true;
  }

  updateLKI(person: binaryPlayerNr | null): void {
    this.lastKnownInformation[person ?? 2] = this.color;
  }

  updateLKIs(): void {
    const persons: (binaryPlayerNr | null)[] = [0, 1, null];
    persons.forEach((person) => {
      if (this.isVisibleTo(person)) {
        this.updateLKI(person);
      }
    });
  }

  set color(color: Color) {
    this._color = color;
    this.updated = true;
  }

  get color(): Color {
    return this._color;
  }
}

export type binaryPlayerNr = 0 | 1;

export type VisibleField = {
  visibleColor: Color | null;
  lastKnownInformation: Color;
};

type Direction =
  | 0 // up
  | 1 // right
  | 2 // down
  | 3; // left

function opposite(direction: Direction): Direction {
  return ((direction + 2) % 4) as Direction;
}

function step(coordinate: CoordinateLike, direction: Direction): Coordinate {
  switch (direction) {
    case 0:
      return new Coordinate(coordinate.x, coordinate.y - 1);
    case 1:
      return new Coordinate(coordinate.x + 1, coordinate.y);
    case 2:
      return new Coordinate(coordinate.x, coordinate.y + 1);
    case 3:
      return new Coordinate(coordinate.x - 1, coordinate.y);
  }
}

export class LighthouseGrid extends Grid<LighthouseField> {
  constructor(width: number, height: number) {
    super(width, height);
    this.fill(new LighthouseField());
    // make sure that each field has an independent object
    this.forEach((_, index) => this.set(index, new LighthouseField()));
  }

  addStone(player: binaryPlayerNr, coordinate: Coordinate): void {
    const color = colorMap[player];
    const field = this.at(coordinate);
    if (!field) {
      // should not happen
      return;
    }
    field.color = color;

    // update visibility in all directions
    const directions: Direction[] = [0, 1, 2, 3];
    directions.forEach((direction: Direction) => {
      const start = step(coordinate, direction);
      const oppositeDirection = opposite(direction);

      for (let pos = start; this.isInBounds(pos); pos = step(pos, direction)) {
        const field = this.at(pos)!;
        field.setVisibleFrom(oppositeDirection, player);
        if (field.color !== Color.EMPTY) {
          break;
        }
      }
    });
  }

  removeStone(coordinate: CoordinateLike): void {
    const field = this.at(coordinate);
    if (!field || field.color === Color.EMPTY) {
      return;
    }
    const owner: binaryPlayerNr = field.color === Color.BLACK ? 0 : 1;
    field.color = Color.EMPTY;
    // owner knows that this field is empty now.
    field.updateLKI(owner);

    // update visibility in all directions
    const directions: Direction[] = [0, 1, 2, 3];
    directions.forEach((direction: Direction) => {
      const start = step(coordinate, direction);
      const oppositeDirection = opposite(direction);
      const visibleFromOpposite = field.visibleFrom[oppositeDirection];

      for (let pos = start; this.isInBounds(pos); pos = step(pos, direction)) {
        const field = this.at(pos)!;
        field.setVisibleFrom(oppositeDirection, visibleFromOpposite);
        if (field.color !== Color.EMPTY) {
          break;
        }
      }
    });
  }

  updateLKIs(): void {
    this.forEach((field) => {
      if (field.updated) {
        field.updateLKIs();
        field.updated = false;
      }
    });
  }
}
