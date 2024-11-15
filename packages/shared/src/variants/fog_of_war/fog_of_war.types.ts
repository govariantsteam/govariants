import { Coordinate, CoordinateLike } from "../../lib/coordinate";
import { Grid } from "../../lib/grid";
import { Color } from "../baduk";

export class FogOfWarField {
  color: Color = Color.EMPTY;
  visibleFrom: (binaryPlayerNr | null)[] = [null, null, null, null];
  lastKnownInformation: Color[] = [Color.EMPTY, Color.EMPTY, Color.EMPTY];

  isVisibleToPlayer(playerNr: binaryPlayerNr): boolean {
    return this.visibleFrom.some((x) => x === playerNr);
  }

  isVisibleToObserver(): boolean {
    return this.isVisibleToPlayer(0) && this.isVisibleToPlayer(1);
  }

  isVisibleTo(person: binaryPlayerNr | null): boolean {
    return person !== null
      ? this.isVisibleToPlayer(person)
      : this.isVisibleToObserver();
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
    if (this.isVisibleTo(player === 0 ? 1 : 0)) {
      // visible to both players
      this.lastKnownInformation[2] = this.color;
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
  addStone(player: binaryPlayerNr, coordinate: Coordinate): void {
    const color = player === 0 ? Color.BLACK : Color.EMPTY;
    const field = this.at(coordinate);
    if (!field) {
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
    if (!field) {
      return;
    }
    field.color = Color.EMPTY;

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
