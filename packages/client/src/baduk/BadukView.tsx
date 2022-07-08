import { BadukState } from "@ogfcommunity/variants-shared";
import { GameViewProps } from "../view_types";

export function BadukView({ gamestate, onMove }: GameViewProps<BadukState>) {
  // https://upload.wikimedia.org/wikipedia/commons/9/9b/Blank_Go_board.svg
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="960"
      height="960"
      viewBox="0 0 96 96"
    >
      <rect width="96" height="96" fill="#DCB35C" />
      <rect
        width="90"
        height="90"
        x="3"
        y="3"
        stroke="#000"
        stroke-width=".2"
        fill="none"
      />
      <path
        stroke="#000"
        stroke-width=".2"
        fill="none"
        d="m3,8h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90m0,5h-90m0,5h90"
      />
      <path
        stroke="#000"
        stroke-width=".2"
        fill="none"
        d="m8,3v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90m5,0v-90m5,0v90"
      />
      <path
        stroke="#000"
        stroke-width=".8"
        stroke-linecap="round"
        d="m18,78l0,0m30,0l0,0m30,0l0,0m0-30l0,0m-30,0l0,0m-30,0l0,0m0-30l0,0m30,0l0,0m30,0l0,0"
      />
      <Stone color="black" />
    </svg>
  );
}

interface StoneProps {
  color: "black" | "white";
}

function Stone({ color }: StoneProps) {
  return <circle fill={color} cx="20" cy="20" r="5" />;
}
