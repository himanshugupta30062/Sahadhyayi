
import * as React from 'react';

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
    console.log('ReactLoader mounted, checking React availability...');
    this.checkReactAvailability();
  }

  componentWillUnmount() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
  }

  checkReactAvailability = () => {
    console.log('Checking React availability, attempt:', this.state.retryCount + 1);
    console.log('React available:', !!React);
    console.log('React.useState available:', typeof React.useState);
    console.log('React.useEffect available:', typeof React.useEffect);
    console.log('React.useContext available:', typeof React.useContext);
    console.log('React.useRef available:', typeof React.useRef);

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

    console.log('React readiness check result:', isReactReady);

    if (isReactReady) {
      console.log('React is ready, rendering children');
      this.setState({ isReactReady: true });
    } else if (this.state.retryCount < this.maxRetries) {
      console.log('React not ready, retrying in 100ms...');
      this.retryInterval = setTimeout(() => {
        this.setState(
          { retryCount: this.state.retryCount + 1 },
          () => this.checkReactAvailability()
        );
      }, 100);
    } else {
      console.error('Max retries reached, React could not be initialized properly');
      // Force render anyway to show error boundary
      this.setState({ isReactReady: true });
    }
  };

  render() {
    console.log('ReactLoader rendering, isReactReady:', this.state.isReactReady);
    
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
