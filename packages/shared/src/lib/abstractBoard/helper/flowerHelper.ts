import { Intersection } from "./types/intersection";
import { Vector2D } from "./types/Vector2D";

export class NGon {
  private readonly numberOfVertices: number;
  private vertices: Intersection[];

  constructor(n: number, refV: Vector2D, refAngle: number) {
    this.numberOfVertices = n;
    const tempVertices: Intersection[] = [];
    const sideLengthRelation = 1 / (2 * Math.sin(Math.PI / n));
    for (let i = 0; i < n; i++) {
      const rad = refAngle + (2 * Math.PI * i) / n;
      const vec = refV.Add(
        Vector2D.fromAngle(rad).Multiply(sideLengthRelation),
      );
      tempVertices.push(new Intersection(vec));
    }
    this.vertices = tempVertices;
    for (let i = 0; i < n; i++) {
      this.getVertex(i).ConnectTo(this.getVertex(i + 1), true);
    }
  }

  public getVertex(index: number): Intersection {
    // modulo respecting negatives
    const accessIndex =
      index < 0
        ? ((index % this.numberOfVertices) + this.numberOfVertices) %
          this.numberOfVertices
        : index % this.numberOfVertices;
    return this.vertices[accessIndex];
  }

  public flatten(): Intersection[] {
    return this.vertices;
  }
}

export class Hexagon extends NGon {
  constructor(refV: Vector2D, refAngle: number) {
    super(6, refV, refAngle);
  }
}

export class Triangle extends NGon {
  constructor(refV: Vector2D, refAngle: number) {
    super(3, refV, refAngle);
  }
}

export function connectTwoSides(
  gon1: NGon,
  index1: number,
  gon2: NGon,
  index2: number,
) {
  gon1.getVertex(index1).ConnectTo(gon2.getVertex(index2), true);
  gon1.getVertex(index1 + 1).ConnectTo(gon2.getVertex(index2 - 1), true);
}

export function createFlowerBoard(size: number): Intersection[] {
  const hexagonLayers: Hexagon[][] = [];
  const triangleLayersUp: Triangle[][] = [];
  const triangleLayersDown: Triangle[][] = [];
  const distanceBetweenAdjacentHexagons = 2 * (1 + Math.cos(Math.PI / 6));
  const vecHexagonsX = Vector2D.fromAngle(0).Multiply(
    distanceBetweenAdjacentHexagons,
  );
  const vecHexagonsY = Vector2D.fromAngle((2 * Math.PI) / 3).Multiply(
    distanceBetweenAdjacentHexagons,
  );

  const distanceTriangleToHexagon = 1 + 2 / Math.sqrt(3);
  const vecTriangleUp = Vector2D.fromAngle((7 * Math.PI) / 6).Multiply(
    distanceTriangleToHexagon,
  );
  const vecTriangleDown = Vector2D.fromAngle((5 * Math.PI) / 6).Multiply(
    distanceTriangleToHexagon,
  );

  const smallerSideLength = Math.ceil((size + 1) / 2);
  const middleIndex = Math.ceil(size / 2);

  for (let i = 0; i <= size; i++) {
    const newHexagonLayer: Hexagon[] = [];
    const newTriangleLayerUp: Triangle[] = [];
    const newTriangleLayerDown: Triangle[] = [];

    const numberHexagons =
      smallerSideLength + (middleIndex - Math.abs(i - middleIndex));

    for (let j = 0; j < numberHexagons; j++) {
      const yVec = vecHexagonsY.Multiply(i);
      let xVec = vecHexagonsX.Multiply(j);
      if (i > middleIndex) {
        xVec = xVec.Add(vecHexagonsX.Multiply(i - middleIndex));
      }

      const newHexagonMiddle = yVec.Add(xVec);
      const newHexagon = new Hexagon(newHexagonMiddle, 0);

      if (i > 0) {
        const upperTriangleIndex = j;
        if (upperTriangleIndex < triangleLayersDown[i - 1].length) {
          const upperTriangle = triangleLayersDown[i - 1][upperTriangleIndex];
          connectTwoSides(newHexagon, 4, upperTriangle, 2);
        }
      }

      newHexagonLayer.push(newHexagon);

      // Triangles

      if (j > 0 || i > middleIndex) {
        const newTriangleUpMiddle = newHexagonMiddle.Add(vecTriangleUp);
        const newTriangleUp = new Triangle(newTriangleUpMiddle, Math.PI / 2);
        connectTwoSides(newHexagon, 3, newTriangleUp, 0);

        if (j > 0) {
          const leftHexagon = newHexagonLayer[j - 1];
          connectTwoSides(leftHexagon, 5, newTriangleUp, 1);
        }

        if (i > 0) {
          const upperHexagon =
            hexagonLayers[i - 1][i <= middleIndex ? j - 1 : j];
          connectTwoSides(upperHexagon, 1, newTriangleUp, 2);
        }

        newTriangleLayerUp.push(newTriangleUp);
      }

      if (j > 0 || i < middleIndex) {
        const newTriangleDownMiddle = newHexagonMiddle.Add(vecTriangleDown);
        const newTriangleDown = new Triangle(
          newTriangleDownMiddle,
          -Math.PI / 2,
        );
        connectTwoSides(newHexagon, 2, newTriangleDown, 1);

        if (j > 0) {
          const leftHexagon = newHexagonLayer[j - 1];
          connectTwoSides(leftHexagon, 0, newTriangleDown, 0);
        }

        newTriangleLayerDown.push(newTriangleDown);
      }

      if (j === numberHexagons - 1) {
        if (i < middleIndex) {
          const newTriangleRightMiddle = newHexagonMiddle.Add(
            vecTriangleUp.Multiply(-1),
          );
          const newTriangleRight = new Triangle(
            newTriangleRightMiddle,
            -Math.PI / 2,
          );
          connectTwoSides(newHexagon, 0, newTriangleRight, 0);
          newTriangleLayerDown.push(newTriangleRight);
        }

        if (i > middleIndex) {
          const newTriangleRightMiddle = newHexagonMiddle.Add(
            vecTriangleDown.Multiply(-1),
          );
          const newTriangleRight = new Triangle(
            newTriangleRightMiddle,
            Math.PI / 2,
          );
          connectTwoSides(newHexagon, 5, newTriangleRight, 1);

          const upperHexagon = hexagonLayers[i - 1][j + 1];
          connectTwoSides(upperHexagon, 1, newTriangleRight, 2);

          newTriangleLayerUp.push(newTriangleRight);
        }
      }
    }

    hexagonLayers.push(newHexagonLayer);
    triangleLayersUp.push(newTriangleLayerUp);
    triangleLayersDown.push(newTriangleLayerDown);
  }

  return hexagonLayers
    .concat(triangleLayersUp)
    .concat(triangleLayersDown)
    .flatMap((layer) => layer.flatMap((nGon) => nGon.flatten()));
}
