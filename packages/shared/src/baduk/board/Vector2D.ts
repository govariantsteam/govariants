export class Vector2D {
    X: number;
    Y: number;

    constructor(x: number, y: number) {
        this.X = x;
        this.Y = y;
    }

    Add(v: Vector2D): Vector2D {
        return new Vector2D(this.X + v.X, this.Y + v.Y);
    }

    Substract(v: Vector2D): Vector2D {
        return new Vector2D(this.X - v.X, this.Y - v.Y);
    }

    Export(): Vector2D
    {
        return new Vector2D(this.X, this.Y);
    }
}