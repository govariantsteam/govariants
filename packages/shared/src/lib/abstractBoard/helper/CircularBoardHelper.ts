import { Intersection } from "../intersection";
import { Vector2D } from "./types/Vector2D";

export function CreateCircularBoard(
  number_of_rings: number,
  nodes_per_ring: number,
): Intersection[] {
  const node_angle = (2 * Math.PI) / nodes_per_ring;
  const rings: Intersection[][] = [];
  for (let i = 0; i < number_of_rings; ++i) {
    rings.push(
      [...Array(nodes_per_ring).keys()].map((x) => {
        const angle = (x + i * 0.5) * node_angle;
        let radius = nodes_per_ring / 2 / Math.PI + i / 2;
        if (i === number_of_rings - 1) {
          radius += 0.4;
        }
        if (i === 0) {
          radius -= 0.2;
        }
        const intersection = new Intersection(
          new Vector2D(radius * Math.sin(angle), radius * Math.cos(angle)),
        );
        return intersection;
      }),
    );
    if (i !== 0) {
      for (let j = 0; j < nodes_per_ring; j++) {
        rings[i][j].connectTo(rings[i - 1][j], true);
        rings[i][j].connectTo(rings[i - 1][(j + 1) % nodes_per_ring], true);
      }
    }
  }
  for (let j = 1; j < nodes_per_ring; ++j) {
    rings[0][j].connectTo(rings[0][j - 1], true);
    rings[number_of_rings - 1][j].connectTo(
      rings[number_of_rings - 1][j - 1],
      true,
    );
  }

  rings[0][nodes_per_ring - 1].connectTo(rings[0][0], true);
  rings[number_of_rings - 1][nodes_per_ring - 1].connectTo(
    rings[number_of_rings - 1][0],
    true,
  );

  return rings.flat();
}
