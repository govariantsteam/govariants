import { Coordinate, CoordinateLike } from "../../lib/coordinate";
import { Grid } from "../../lib/grid";
import { Color } from "../baduk";

const colorMap: { [p: number]: Color } = {
  0: Color.BLACK,
  1: Color.WHITE,
};

export class FogOfWarField {
  color: Color = Color.EMPTY;
  visibleFrom: (binaryPlayerNr | null)[] = [null, null, null, null];
  lastKnownInformation: Color[] = [Color.EMPTY, Color.EMPTY, Color.EMPTY];

  isVisibleToPlayer(
    playerNr: binaryPlayerNr,
    fromDirection?: Direction,
  ): boolean {
    if (fromDirection !== undefined) {
      return (
        this.color === colorMap[playerNr] ||
        this.visibleFrom[fromDirection] === playerNr
      );
    }
    return (
      this.color === colorMap[playerNr] ||
      this.visibleFrom.some((x) => x === playerNr)
    );
  }

  // Here we need to be careful not to reveal information to the players.
  // Observers may only see public information.
  isVisibleToObserver(): boolean {
    const directions: Direction[] = [0, 1, 2, 3];
    return directions.some(
      (direction) =>
        this.isVisibleToPlayer(0, direction) &&
        this.isVisibleToPlayer(1, opposite(direction)),
    );
  }

  isVisibleTo(person: binaryPlayerNr | null): boolean {
    return person === null
      ? this.isVisibleToObserver()
      : this.isVisibleToPlayer(person);
  }

  exportFor(person: binaryPlayerNr | null): VisibleField {
    return {
      visibleColor: this.isVisibleTo(person) ? this.color : null,
      lastKnownInformation: this.lastKnownInformation[person ?? 2],
    };
  }

  setVisibleFrom(direction: Direction, player: binaryPlayerNr | null): void {
    this.visibleFrom[direction] = player;

    // update last known information
    if (player) {
      this.lastKnownInformation[player] = this.color;
    }
    if (this.isVisibleToObserver()) {
      this.lastKnownInformation[2] = this.color;
    }
  }

  setColor(color: Color): void {
    this.color = color;
    if (this.isVisibleToPlayer(0)) {
      this.lastKnownInformation[0] = color;
    }
    if (this.isVisibleToPlayer(1)) {
      this.lastKnownInformation[1] = color;
    }
    if (this.isVisibleToObserver()) {
      this.lastKnownInformation[2] = color;
    }
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

export class FogOfWarBoard extends Grid<FogOfWarField> {
  constructor(width: number, height: number) {
    super(width, height);
    this.arr.fill(new FogOfWarField());
    // make sure that each field has an independent object
    this.arr.forEach((_, index) => (this.arr[index] = new FogOfWarField()));
  }

  addStone(player: binaryPlayerNr, coordinate: Coordinate): void {
    const color = colorMap[player];
    const field = this.at(coordinate);
    if (!field) {
      // should not happen
      return;
    }
    field.setColor(color);

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
    if (!field) {
      return;
    }
    field.setColor(Color.EMPTY);

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
}
