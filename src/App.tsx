import React, { useState } from 'react';

function App() {
  // Test if basic React hooks work
  const [message, setMessage] = useState('React is working!');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        {message}
      </h1>
      <button 
        onClick={() => setMessage('Button clicked! React hooks are working!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test useState
      </button>
      <p style={{ marginTop: '20px', color: '#666' }}>
        If you can see this and the button works, React is functioning properly.
      </p>
    </div>
  );
}

export default App;