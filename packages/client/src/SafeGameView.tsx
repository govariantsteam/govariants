import { GameViewProps } from "./view_types";
import React from "react";
import { view_map } from "./view_map";

interface SafeGameViewProps extends GameViewProps<any> {
  variant: string;
}

export function SafeGameView(props: SafeGameViewProps) {
  const GameViewComponent = view_map[props.variant];

  return (
    <ErrorBoundary>
      <GameViewComponent {...props} />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: any },
  { error: unknown }
> {
  constructor(props: { children: any }) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      return <div style={{ color: "red" }}>{String(this.state.error)}</div>;
    }

    return this.props.children;
  }
}
