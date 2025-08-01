import React from 'react';

// Minimal test component to verify React works
function SimpleTest() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('React hooks working!');
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>React Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <p>If you can see this and click the button, React is working.</p>
    </div>
  );
}

function App() {
  return <SimpleTest />;
}

export default App;