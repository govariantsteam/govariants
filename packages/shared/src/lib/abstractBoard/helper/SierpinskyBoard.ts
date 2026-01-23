import { Intersection } from "../intersection";
import { Vector2D } from "./types/Vector2D";

export function createSierpinskyBoard(depth: number): Intersection[] {
  const radius = Math.pow(2, depth + 1) / Math.sqrt(3);

  const middleIntersections = [0, 1, 2].map(
    (number) =>
      new Intersection(
        new Vector2D(
          Math.cos((Math.PI * (0.5 + 2 * number)) / 3),
          Math.sin((Math.PI * (0.5 + 2 * number)) / 3),
        ).Multiply(radius),
      ),
  ) as [Intersection, Intersection, Intersection];

  const sierpinskyTriangle = new SierpinskyTriangle(middleIntersections, depth);

  return [...middleIntersections, ...sierpinskyTriangle.flatten()];
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
          corner.position.Add(corners[(index + 1) % 3].position).Multiply(0.5),
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
        intersection.connectTo(this.middleIntersections[(index + 1) % 3], true);
        intersection.connectTo(corners[index], true);
        intersection.connectTo(corners[(index + 1) % 3], true);
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
