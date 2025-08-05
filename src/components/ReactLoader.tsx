
import React from 'react';

interface ReactLoaderProps {
  children: React.ReactNode;
}

interface ReactLoaderState {
  isReactReady: boolean;
  retryCount: number;
}

class ReactLoader extends React.Component<ReactLoaderProps, ReactLoaderState> {
  private maxRetries = 10;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor(props: ReactLoaderProps) {
    super(props);
    this.state = {
      isReactReady: false,
      retryCount: 0,
    };
  }

  componentDidMount() {
    this.checkReactAvailability();
  }

  componentWillUnmount() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
  }

  checkReactAvailability = () => {
    // Check if React and all essential hooks are available
    const isReactReady = !!(
      React && 
      React.useState && 
      React.useEffect && 
      React.useContext && 
      React.useRef &&
      React.createElement &&
      React.Component &&
      typeof React.useState === 'function' &&
      typeof React.useEffect === 'function' &&
      typeof React.useContext === 'function' &&
      typeof React.useRef === 'function'
    );

    if (isReactReady) {
      this.setState({ isReactReady: true });
    } else if (this.state.retryCount < this.maxRetries) {
      this.retryInterval = setTimeout(() => {
        this.setState(
          { retryCount: this.state.retryCount + 1 },
          () => this.checkReactAvailability()
        );
      }, 100);
    } else {
      // Force render anyway to show error boundary
      this.setState({ isReactReady: true });
    }
  };

  render() {
    
    if (!this.state.isReactReady) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Loading Sahadhyayi... ({this.state.retryCount}/{this.maxRetries})
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ReactLoader;
