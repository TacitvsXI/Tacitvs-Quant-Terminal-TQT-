"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { logBoundaryError } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error using our error logger
    logBoundaryError(error, { componentStack: errorInfo.componentStack ?? undefined }, {
      boundaryType: "ErrorBoundary",
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0b0e]">
          <Card className="max-w-2xl w-full border-[var(--color-danger)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[var(--color-danger)]">
                <span className="text-4xl">⚠️</span>
                <span>Something Went Wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg">
                <div className="text-sm font-mono text-[var(--color-danger)] mb-2">
                  Error:
                </div>
                <div className="text-sm font-mono text-neutral-300">
                  {this.state.error?.message || "Unknown error occurred"}
                </div>
              </div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="p-4 bg-[#0a0a14] border border-neutral-800 rounded-lg">
                  <summary className="text-sm font-mono text-neutral-400 cursor-pointer hover:text-[var(--color-secondary)]">
                    Show stack trace
                  </summary>
                  <pre className="mt-3 text-xs font-mono text-neutral-500 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-neutral-500 text-center pt-4 border-t border-neutral-800">
                If this problem persists, please contact support or check the console for more details.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper for functional components that need error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

