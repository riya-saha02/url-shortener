import { useParams } from 'react-router-dom';

// The actual redirect is handled server-side at {API_BASE_URL}/r/{code}.
// This page only renders if someone opens a /r/:code path directly on the
// frontend origin (e.g. pasted a relative link by mistake) instead of the API.
export default function RedirectNotice() {
  const { code } = useParams();
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  return (
    <div className="auth-shell">
      <div className="panel" style={{ maxWidth: 420, textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-dim)', marginBottom: 16 }}>
          Short links resolve through the API, not this app. Try:
        </p>
        <a className="mono" href={`${apiBase}/r/${code}`} style={{ fontSize: 15 }}>
          {apiBase}/r/{code}
        </a>
      </div>
    </div>
  );
}
