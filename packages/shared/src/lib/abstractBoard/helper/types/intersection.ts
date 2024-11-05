import type { Vector2D } from "./Vector2D";

// class is used in the board creation functions
export class Intersection {
  Neighbours: Intersection[];
  Position: Vector2D;

  constructor(v: Vector2D) {
    this.Position = v;
    this.Neighbours = [];
  }

  ConnectTo(intersection: Intersection, bothSides: boolean) {
    this.Neighbours.push(intersection);
    if (bothSides) {
      intersection.ConnectTo(this, false);
    }
  }

  IsConnectedTo(intersection: Intersection): boolean {
    return this.Neighbours.includes(intersection);
  }

  Export(): Intersection {
    const intersection = new Intersection(this.Position.Export());
    //ToDo: How to export Neighbours?
    return intersection;
  }
}
