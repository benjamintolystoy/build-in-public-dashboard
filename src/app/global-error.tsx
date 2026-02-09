'use client';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', padding: '2rem' }}>
          <h2 style={{ color: '#f87171', fontSize: '1.5rem', fontWeight: 'bold' }}>Global Error</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '500px', textAlign: 'center' }}>
            {error.message}
          </p>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', maxWidth: '600px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {error.stack}
          </pre>
          {error.digest && <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Digest: {error.digest}</p>}
          <button onClick={reset} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} type="button">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
