import { Color, StoneState } from "./StoneState";
import type { Vector2D } from "./Vector2D";

export class Intersection {
  Neighbours: Intersection[];
  Position: Vector2D;
  StoneState: StoneState;

  constructor(v: Vector2D) {
    this.Position = v;
    this.Neighbours = [];
    this.StoneState = new StoneState(Color.EMPTY);
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
    intersection.StoneState = this.StoneState.Export();
    //ToDo: How to export Neighbours?
    return intersection;
  }
}
