import { Color, StoneState } from "./StoneState";
import type { Vector2D } from "./Vector2D";

export class Intersection {
    Neighbours: Intersection[];
    Position: Vector2D;
    Identifier: number;
    StoneState: StoneState;

    constructor(v: Vector2D) {
        this.Position = v;
        this.Neighbours = [];
        this.Identifier = 0;
        this.StoneState = new StoneState(Color.EMPTY);
    }

    ConnectTo(intersection: Intersection, bothSides: Boolean) {
        this.Neighbours.push(intersection);
        if (bothSides) {
            intersection.ConnectTo(this, false);
        }
    }

    IsConnectedTo(intersection: Intersection): Boolean {
        return this.Neighbours.includes(intersection);
    }

    Export(): Intersection
    {
        let intersection = new Intersection(this.Position.Export())
        intersection.Identifier = this.Identifier;
        intersection.StoneState = this.StoneState.Export();
        //ToDo: How to export Neighbours?
        return intersection;
    }
}