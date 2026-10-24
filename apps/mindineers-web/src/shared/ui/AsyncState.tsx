import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { normalizeError } from "../services/errors";
export function LoadingState({
  label = "Opening your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="notice" role="status" aria-live="polite" aria-busy="true">
      {label}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
  children,
}: {
  error: unknown;
  retry?: () => void;
  children?: ReactNode;
}) {
  const safe = normalizeError(error);
  return (
    <section className="empty" role="alert">
      <h2>We couldn’t complete that action.</h2>
      <p>{safe.message}</p>
      {retry && (
        <button type="button" className="button" onClick={retry}>
          Try again
        </button>
      )}
      {children}
    </section>
  );
}
export class RouteBoundary extends Component<
  { children: ReactNode; onError?: (info: { componentStack: string }) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.props.onError?.({ componentStack: info.componentStack ?? "" });
  }
  render() {
    return this.state.failed ? (
      <section className="empty" role="alert">
        <h2>This screen couldn’t open.</h2>
        <p>
          Your stored workspace has not been cleared. Try this screen again or
          return to your dashboard.
        </p>
        <button
          type="button"
          className="button"
          onClick={() => this.setState({ failed: false })}
        >
          Try screen again
        </button>
        <a className="button" href="#home">
          Return to dashboard
        </a>
      </section>
    ) : (
      this.props.children
    );
  }
}
export function SaveFailure({
  retry,
  exportData,
}: {
  retry: () => void;
  exportData: () => void;
}) {
  return (
    <div className="notice conflict-notice" role="alert">
      <div>
        <strong>Your latest changes are not saved.</strong>
        <p>
          Keep this tab open. Export your work before leaving, or retry after
          freeing browser storage.
        </p>
      </div>
      <button className="button" type="button" onClick={exportData}>
        Export unsaved work
      </button>
      <button className="button" type="button" onClick={retry}>
        Retry saving
      </button>
    </div>
  );
}
