import React from "react";

const SPACING = 5;
const BORDER = 3;
const LINE_PROPS = { stroke: "black", strokeWidth: ".2" };

export interface Stone {
  color?: string;
  // Not yet implemented
  // This would be "circle"/"triangle"/"square"/"mark"/letter/number
  annotation?: string;
}

interface GridBoardProps {
  onClick: (pos: { x: number; y: number }) => void;
  board: Stone[][];
}

/** A board that can display most variants that are played on an NxM board. */
export function GridBoard({ board, onClick }: GridBoardProps) {
  const height = board.length;
  const width = board[0].length;
  if (board.some((row) => row.length !== width)) {
    throw Error(`Not a grid!`);
  }

  const w_px_inner = (width - 1) * SPACING;
  const h_px_inner = (height - 1) * SPACING;
  const w_px_outer = w_px_inner + BORDER * 2;
  const h_px_outer = h_px_inner + BORDER * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${w_px_outer} ${h_px_outer}`}
    >
      <rect width={`${w_px_outer}`} height={`${h_px_outer}`} fill="#DCB35C" />
      <rect
        width={`${w_px_inner}`}
        height={`${h_px_inner}`}
        x={`${BORDER}`}
        y={`${BORDER}`}
        {...LINE_PROPS}
        fill="none"
      />
      {getInnerLinePositions(height).map((pos) => (
        // horizontal lines
        <line
          key={`${pos}`}
          x1={`${BORDER}`}
          y1={`${pos}`}
          x2={`${BORDER + w_px_inner}`}
          y2={`${pos}`}
          {...LINE_PROPS}
        />
      ))}
      {getInnerLinePositions(width).map((pos) => (
        // vertical lines
        <line
          key={`${pos}`}
          x1={`${pos}`}
          y1={`${BORDER}`}
          x2={`${pos}`}
          y2={`${BORDER + h_px_inner}`}
          {...LINE_PROPS}
        />
      ))}
      {map2d(board, (stone, x, y) => (
        <StoneComponent key={`${x}-${y}`} x={x} y={y} {...stone} />
      ))}
      {map2d(board, (_stone, x, y) => (
        <ClickRect key={`${x}-${y}`} x={x} y={y} onClick={onClick} />
      ))}
    </svg>
  );
}

interface StoneWithCoords extends Stone {
  x: number;
  y: number;
}

function StoneComponent({ color, x, y }: StoneWithCoords) {
  return (
    <>
      {color && (
        <circle
          fill={color}
          stroke="black"
          strokeWidth="0.1"
          cx={`${BORDER + SPACING * x}`}
          cy={`${BORDER + SPACING * y}`}
          r={`${SPACING / 2 - 0.1}`}
        />
      )}
    </>
  );
}

function getInnerLinePositions(n: number): number[] {
  return [...Array(n - 2).keys()].map(
    (row) => BORDER + row * SPACING + SPACING
  );
}

interface ClickRectProps {
  x: number;
  y: number;
  onClick: (pos: { x: number; y: number }) => void;
}
function ClickRect({ x, y, onClick }: ClickRectProps) {
  const HALF_SPACE = SPACING / 2;

  return (
    <rect
      opacity={0.0}
      x={`${BORDER + SPACING * x - HALF_SPACE}`}
      y={`${BORDER + SPACING * y - HALF_SPACE}`}
      width={`${SPACING}`}
      height={`${SPACING}`}
      onClick={() => onClick({ x, y })}
    />
  );
}

export function map2d<T, ResT>(
  arr2d: T[][],
  f: (val: T, x: number, y: number) => ResT
): ResT[][] {
  return arr2d.map((row, y) => row.map((val, x) => f(val, x, y)));
}
