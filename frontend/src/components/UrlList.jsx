import { useState } from 'react';
import { urlApi } from '../api/client';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function UrlList({ urls, onSelect, selectedCode, onDeactivated }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (shortUrl, code) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleDeactivate = async (code, e) => {
    e.stopPropagation();
    if (!window.confirm(`Deactivate ${code}? This link will stop redirecting.`)) return;
    await urlApi.deactivate(code);
    onDeactivated(code);
  };

  if (urls.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-dim)' }}>
        <p style={{ margin: 0, fontSize: 15 }}>No links yet.</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-faint)' }}>
          Paste a URL above to create your first short link.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {urls.map((u) => (
        <div
          key={u.id}
          onClick={() => onSelect(u.shortCode)}
          className="panel"
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            borderColor: selectedCode === u.shortCode ? 'var(--accent)' : 'var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            opacity: u.active ? 1 : 0.5,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="mono" style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 15 }}>
                /{u.shortCode}
              </span>
              {!u.active && (
                <span style={{ fontSize: 11, color: 'var(--danger)', border: '1px solid rgba(255,107,107,0.35)', borderRadius: 4, padding: '1px 6px' }}>
                  inactive
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-dim)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 3,
              }}
            >
              {u.originalUrl}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
              {u.clickCount}
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 400, marginLeft: 4 }}>
                click{u.clickCount === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{timeAgo(u.createdAt)}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              className="btn"
              style={{ padding: '7px 12px', fontSize: 13 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(u.shortUrl, u.shortCode);
              }}
            >
              {copiedCode === u.shortCode ? 'Copied ✓' : 'Copy'}
            </button>
            {u.active && (
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={(e) => handleDeactivate(u.shortCode, e)}
                title="Deactivate this link"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
