import { Vector2D } from "./Vector2D";
import { Intersection } from "./intersection";

export function createSierpinskyBoard(depth: number): Intersection[] {
  const sideLength = Math.pow(2, depth + 1);

  const top = new Vector2D(0, 0);
  const topCorner = new Intersection(top);

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

  const sierpinskyTriangle = new SierpinskyTriangle([top, left, right], depth);
  sierpinskyTriangle.connectCorner(topCorner, 0);
  sierpinskyTriangle.connectCorner(leftCorner, 1);
  sierpinskyTriangle.connectCorner(rightCorner, 2);

  return [
    topCorner,
    leftCorner,
    rightCorner,
    ...sierpinskyTriangle.flatten(),
  ].map((intersection, index) => {
    intersection.Identifier = index;
    return intersection;
  });
}

class SierpinskyTriangle {
  private subTriangles: null | SierpinskyTriangle[];

  private middleIntersections: Intersection[];

  constructor(corners: [Vector2D, Vector2D, Vector2D], depth: number) {
    const middles = corners.map((corner, index) =>
      corner.Add(corners[(index + 1) % 3]).Multiply(0.5),
    );
    this.middleIntersections = middles.map(
      (vector) => new Intersection(vector),
    );

    if (depth > 0) {
      this.subTriangles = corners.map((corner, index) => {
        const triangle = new SierpinskyTriangle(
          [corner, middles[index], middles[(index + 2) % 3]],
          depth - 1,
        );

        triangle.connectCorner(this.middleIntersections[index], 1);
        triangle.connectCorner(this.middleIntersections[(index + 2) % 3], 2);

        return triangle;
      });
    } else {
      this.subTriangles = null;

      this.middleIntersections.forEach((intersection, index) =>
        intersection.ConnectTo(this.middleIntersections[(index + 1) % 3], true),
      );
    }
  }

  connectCorner(corner: Intersection, index: number) {
    if (this.subTriangles) {
      this.subTriangles[index].connectCorner(corner, 0);
      return;
    }

    this.middleIntersections[index].ConnectTo(corner, true);
    this.middleIntersections[(index + 2) % 3].ConnectTo(corner, true);
  }

  flatten(): Intersection[] {
    return [
      ...this.middleIntersections,
      ...(this.subTriangles
        ? [
            ...this.subTriangles[0].flatten(),
            ...this.subTriangles[1].flatten(),
            ...this.subTriangles[2].flatten(),
          ]
        : []),
    ];
  }
}
