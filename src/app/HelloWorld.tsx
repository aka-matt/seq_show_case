import React from 'react';

interface HelloWorldProps {
  name?: string;
}

/**
 * Placeholder React component for Phase 0
 * Demonstrates React is mounted correctly in Shadow DOM
 */
export function HelloWorld({ name = 'World' }: HelloWorldProps): React.ReactElement {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: '#2563eb', margin: '0 0 16px 0' }}>
        Hello, {name}!
      </h2>
      <p style={{ color: '#667085', margin: '0 0 16px 0' }}>
        This is a React component running inside Shadow DOM.
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '8px 16px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Clicked: {count}
      </button>
    </div>
  );
}
