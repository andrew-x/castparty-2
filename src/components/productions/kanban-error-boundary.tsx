"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  resetKey: number
}

const DOM_ERROR_PATTERNS = ["removeChild", "insertBefore", "appendChild"]

function isDomManipulationError(error: Error): boolean {
  return DOM_ERROR_PATTERNS.some((p) => error.message.includes(p))
}

/**
 * Catches DOM manipulation errors (e.g. removeChild race conditions between
 * dnd-kit and React reconciliation) and recovers by re-mounting children.
 * Non-DOM errors are re-thrown so they propagate to the nearest general
 * error boundary.
 */
export class KanbanErrorBoundary extends Component<Props, State> {
  state: State = { resetKey: 0 }

  static getDerivedStateFromError(error: Error): State | null {
    if (isDomManipulationError(error)) {
      return { resetKey: Date.now() }
    }
    return null
  }

  componentDidCatch(error: Error) {
    if (isDomManipulationError(error)) {
      // Silently recover — the re-mount restores a consistent state
      return
    }
    throw error
  }

  render() {
    return (
      <div key={this.state.resetKey} className="contents">
        {this.props.children}
      </div>
    )
  }
}
