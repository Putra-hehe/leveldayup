import React from "react";

import { isKnownDomRaceError } from "../utils/domGuards";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false as boolean, message: undefined as string | undefined };

  static getDerivedStateFromError(error: unknown) {
    if (isKnownDomRaceError(error)) {
      return { hasError: false, message: undefined };
    }

    const message =
      error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Unknown error";

    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    if (isKnownDomRaceError(error)) {
      console.warn("Ignored known DOM portal race", error);
      return;
    }

    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="cinematic-panel max-w-lg p-6 text-center sm:p-8">
            <div className="scene-kicker">System recovery</div>
            <h1 className="mt-3 text-2xl font-semibold text-white">Oops, ada error yang perlu dimuat ulang</h1>
            <p className="mt-3 text-sm text-slate-300">{this.state.message}</p>
            <button
              className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => window.location.reload()}
            >
              Reload aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
