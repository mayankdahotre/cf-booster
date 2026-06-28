import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'Verdana, Arial, sans-serif',
            fontSize: 13,
            color: '#000',
            background: '#e1e1e1',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #b9b9b9',
              borderRadius: 5,
              padding: 16,
              maxWidth: 600,
            }}
          >
            <h2 style={{ color: '#c00', marginTop: 0 }}>CF Booster failed to load</h2>
            <p>{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#2175a4',
                color: '#fff',
                border: '1px solid #1a5f8a',
                padding: '4px 12px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
