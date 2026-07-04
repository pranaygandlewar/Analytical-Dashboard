import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-800 dark:text-white">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] p-8 shadow-2xl text-center space-y-6">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                A rendering crash occurred in this workspace container view. Try refreshing or contact your project administrator.
              </p>
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition"
            >
              <RefreshCw size={16} />
              Reload Workspace Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
