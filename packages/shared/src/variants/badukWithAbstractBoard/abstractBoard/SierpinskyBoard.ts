import { Vector2D } from "./Vector2D";
import { Intersection } from "./intersection";

export function createSierpinskyBoard(depth: number): Intersection[] {
  const sideLength = Math.pow(2, depth + 1);

  const topCorner = new Intersection(new Vector2D(0, 0));
  const leftCorner = new Intersection(
    new Vector2D(
      Math.cos((2 * Math.PI) / 3),
      Math.sin((2 * Math.PI) / 3),
    ).Multiply(sideLength),
  );
  const rightCorner = new Intersection(
    new Vector2D(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)).Multiply(
      sideLength,
    ),
  );

  const sierpinskyTriangle = new SierpinskyTriangle(
    [topCorner, leftCorner, rightCorner],
    depth,
  );

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

  constructor(
    corners: [Intersection, Intersection, Intersection],
    depth: number,
  ) {
    this.middleIntersections = corners.map(
      (corner, index) =>
        new Intersection(
          corner.Position.Add(corners[(index + 1) % 3].Position).Multiply(0.5),
        ),
    );

    if (depth > 0) {
      this.subTriangles = corners.map(
        (corner, index) =>
          new SierpinskyTriangle(
            [
              corner,
              this.middleIntersections[index],
              this.middleIntersections[(index + 2) % 3],
            ],
            depth - 1,
          ),
      );
    } else {
      this.subTriangles = null;

      this.middleIntersections.forEach((intersection, index) => {
        intersection.ConnectTo(this.middleIntersections[(index + 1) % 3], true);
        intersection.ConnectTo(corners[index], true);
        intersection.ConnectTo(corners[(index + 1) % 3], true);
      });
    }
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
