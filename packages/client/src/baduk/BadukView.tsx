import { BadukState, Color } from "@ogfcommunity/variants-shared";
import React from "react";
import { GameViewProps } from "../view_types";

const SPACING = 5;
const BORDER = 3;

export function BadukView({ gamestate }: GameViewProps<BadukState>) {
  const config = {
    width: gamestate.board[0].length,
    height: gamestate.board.length,
  };

  const w_inner = (config.width - 1) * SPACING;
  const h_inner = (config.height - 1) * SPACING;
  const w = w_inner + BORDER * 2;
  const h = h_inner + BORDER * 2;
  const line_props = { stroke: "black", strokeWidth: ".2" };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="400"
      height="400"
      viewBox={`0 0 ${w} ${h}`}
    >
      <rect width={`${w}`} height={`${h}`} fill="#DCB35C" />
      <rect
        width={`${w_inner}`}
        height={`${h_inner}`}
        x={`${BORDER}`}
        y={`${BORDER}`}
        {...line_props}
        fill="none"
      />
      {getInnerLinePositions(config.height).map((pos) => (
        // horizontal lines
        <line
          key={`${pos}`}
          x1={`${BORDER}`}
          y1={`${pos}`}
          x2={`${BORDER + w_inner}`}
          y2={`${pos}`}
          {...line_props}
        />
      ))}
      {getInnerLinePositions(config.width).map((pos) => (
        // vertical lines
        <line
          key={`${pos}`}
          x1={`${pos}`}
          y1={`${BORDER}`}
          x2={`${pos}`}
          y2={`${BORDER + h_inner}`}
          {...line_props}
        />
      ))}
      {gamestate.board.map((row, y) =>
        row.map((color, x) => {
          if (color === Color.BLACK) {
            return <Stone key={`${x}-${y}`} color="black" x={x} y={y} />;
          }

          if (color === Color.WHITE) {
            return <Stone key={`${x}-${y}`} color="white" x={x} y={y} />;
          }
          return <React.Fragment key={`${x}-${y}`} />;
        })
      )}
    </svg>
  );
}

interface StoneProps {
  color: "black" | "white";
  x: number;
  y: number;
}

function Stone({ color, x, y }: StoneProps) {
  return (
    <circle
      fill={color}
      stroke="black"
      strokeWidth="0.1"
      cx={`${BORDER + SPACING * x}`}
      cy={`${BORDER + SPACING * y}`}
      r={`${SPACING / 2 - 0.1}`}
    />
  );
}

function getInnerLinePositions(n: number): number[] {
  return [...Array(n - 2).keys()].map(
    (row) => BORDER + row * SPACING + SPACING
  );
}
