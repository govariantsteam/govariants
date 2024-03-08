import { Vector2D } from "./Vector2D";
import { Intersection } from "./intersection";

export function createSierpinskyBoard(depth: number): Intersection[] {
  const top = new Vector2D(0, 0);
  const topCorner = new Intersection(top);
  const sideLength = Math.pow(2, depth + 1);

  const left = new Vector2D(
    Math.cos((2 * Math.PI) / 3),
    Math.sin((2 * Math.PI) / 3),
  ).Multiply(sideLength);
  const leftCorner = new Intersection(left);

  const right = new Vector2D(
    Math.cos(Math.PI / 3),
    Math.sin(Math.PI / 3),
  ).Multiply(sideLength);
  const rightCorner = new Intersection(right);

  const sierpinskyTriangle = new SierpinskyTriangle(top, left, right, depth);
  sierpinskyTriangle.connectTopCorner(topCorner);
  sierpinskyTriangle.connectLeftCorner(leftCorner);
  sierpinskyTriangle.connectRightCorner(rightCorner);

  return sierpinskyTriangle.flatten().map((intersection, index) => {
    intersection.Identifier = index;
    return intersection;
  });
}

class SierpinskyTriangle {
  private top: SierpinskyTriangle | null;
  private right: SierpinskyTriangle | null;
  private left: SierpinskyTriangle | null;

  private middleLeft: Intersection;
  private middleRight: Intersection;
  private middleBottom: Intersection;

  constructor(top: Vector2D, left: Vector2D, right: Vector2D, depth: number) {
    const vecMiddleLeft = top.Add(left).Multiply(0.5);
    const vecMiddleRight = top.Add(right).Multiply(0.5);
    const vecMiddleBottom = left.Add(right).Multiply(0.5);

    this.middleLeft = new Intersection(vecMiddleLeft);
    this.middleRight = new Intersection(vecMiddleRight);
    this.middleBottom = new Intersection(vecMiddleBottom);

    if (depth > 0) {
      this.top = new SierpinskyTriangle(
        top,
        vecMiddleLeft,
        vecMiddleRight,
        depth - 1,
      );
      this.top.connectLeftCorner(this.middleLeft);
      this.top.connectRightCorner(this.middleRight);

      this.left = new SierpinskyTriangle(
        vecMiddleLeft,
        left,
        vecMiddleBottom,
        depth - 1,
      );
      this.left.connectTopCorner(this.middleLeft);
      this.left.connectRightCorner(this.middleBottom);

      this.right = new SierpinskyTriangle(
        vecMiddleRight,
        vecMiddleBottom,
        right,
        depth - 1,
      );
      this.right.connectTopCorner(this.middleRight);
      this.right.connectLeftCorner(this.middleBottom);
    } else {
      this.top = null;
      this.left = null;
      this.right = null;

      this.middleLeft.ConnectTo(this.middleRight, true);
      this.middleLeft.ConnectTo(this.middleBottom, true);
      this.middleRight.ConnectTo(this.middleBottom, true);
    }
  }

  connectTopCorner(topCorner: Intersection) {
    if (this.top) {
      this.top.connectTopCorner(topCorner);
      return;
    }

    this.middleLeft.ConnectTo(topCorner, true);
    this.middleRight.ConnectTo(topCorner, true);
  }
  connectLeftCorner(leftCorner: Intersection) {
    if (this.left) {
      this.left.connectLeftCorner(leftCorner);
      return;
    }

    this.middleLeft.ConnectTo(leftCorner, true);
    this.middleBottom.ConnectTo(leftCorner, true);
  }
  connectRightCorner(rightCorner: Intersection) {
    if (this.right) {
      this.right.connectRightCorner(rightCorner);
      return;
    }

    this.middleRight.ConnectTo(rightCorner, true);
    this.middleBottom.ConnectTo(rightCorner, true);
  }

  flatten(): Intersection[] {
    return [
      this.middleLeft,
      this.middleRight,
      this.middleBottom,
      ...(this.top ? this.top.flatten() : []),
      ...(this.left ? this.left.flatten() : []),
      ...(this.right ? this.right.flatten() : []),
    ];
  }
}
