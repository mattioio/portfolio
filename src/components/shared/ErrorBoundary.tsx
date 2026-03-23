import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
          <div className="max-w-md text-center">
            <div className="mb-4 text-4xl">:/</div>
            <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="mb-6 text-sm text-zinc-400">
              An unexpected error occurred. Your work is saved automatically.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleDismiss}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
              >
                Reload page
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400">
                  Error details
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-900 p-3 text-[11px] text-zinc-500">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
