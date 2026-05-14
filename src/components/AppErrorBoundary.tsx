import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error) {
    console.error('App crashed', error);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, message: '' });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    try {
      window.localStorage.removeItem('struccalc.projects.v3');
      window.localStorage.removeItem('struccalc.activeProject.v3');
      window.localStorage.removeItem('struccalc.sessionMode.v3');
    } catch {
      // ignore storage reset failures
    }
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-900 p-8 text-slate-200 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-xl border border-red-900/50 bg-slate-800 p-6 shadow-2xl">
          <h1 className="text-xl font-bold text-red-400">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-400">
            The app hit an error. Your data is safe — try one of the options below.
          </p>

          {this.state.message && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300 border border-slate-700">{this.state.message}</pre>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={this.handleTryAgain}
              className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Try again
            </button>
            <button
              onClick={this.handleGoHome}
              className="rounded bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors"
            >
              Go to home
            </button>
            <button
              onClick={this.handleReset}
              className="rounded bg-slate-700 hover:bg-red-900/40 px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
              title="Wipes saved projects from this browser"
            >
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

