import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { MSG } from '../../constants/messages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-1 p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {MSG.GENERIC_ERROR}
            </h1>
            <p className="mb-6 text-muted">
              {MSG.GENERIC_ERROR_RELOAD}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
