"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/** Lightweight boundary so a preview crash doesn't take down the whole page. */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[EdgeLens preview]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center"
            role="alert"
          >
            <div>
              <p className="text-sm text-foreground">Preview failed to render</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {this.state.message}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => this.setState({ hasError: false, message: "" })}
              >
                Retry preview
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
