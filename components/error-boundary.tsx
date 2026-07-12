"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[EdgeLens]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-foreground">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button
            className="mt-4"
            size="sm"
            variant="outline"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
