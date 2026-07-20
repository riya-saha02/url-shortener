import { useState } from 'react';
import { urlApi } from '../api/client';

export default function UrlForm({ onCreated }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expiryDays, setExpiryDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { originalUrl };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      if (expiryDays) payload.expiryDays = Number(expiryDays);

      const { data } = await urlApi.shorten(payload);
      onCreated(data);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiryDays('');
      setShowAdvanced(false);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit reached — try again in a minute.');
      } else {
        setError(err.response?.data?.message || 'Could not shorten that URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ marginBottom: 28 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="url"
            required
            placeholder="https://your-long-url.com/goes/here"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-raised)',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              padding: '12px 14px',
              color: 'var(--ink)',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Snipping…' : 'Shorten'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-dim)',
            fontSize: 13,
            padding: '10px 2px 0',
            cursor: 'pointer',
          }}
        >
          {showAdvanced ? '− Hide options' : '+ Custom alias / expiry'}
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input
              type="text"
              placeholder="custom-alias (optional)"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="mono"
              style={{
                flex: 1,
                background: 'var(--bg-raised)',
                border: '1px solid var(--panel-border)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--ink)',
                fontSize: 14,
              }}
            />
            <input
              type="number"
              min="1"
              placeholder="Expires in days (optional)"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              style={{
                width: 220,
                background: 'var(--bg-raised)',
                border: '1px solid var(--panel-border)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--ink)',
                fontSize: 14,
              }}
            />
          </div>
        )}

        {error && <p className="error-text" style={{ marginTop: 12, marginBottom: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
