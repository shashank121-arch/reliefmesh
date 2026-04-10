"use client"
import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="glass-card p-8 text-center m-4 border-[var(--border-gold)]">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-display italic text-2xl text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {this.state.error?.message || 'An unexpected error occurred during protocol execution.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold px-8 py-3 rounded-full font-bold"
          >
            Reload Platform
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
