import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { urlApi } from '../api/client';

export default function AnalyticsPanel({ shortCode, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortCode) return;
    setLoading(true);
    setError('');
    urlApi
      .analytics(shortCode)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load analytics for this link.'))
      .finally(() => setLoading(false));
  }, [shortCode]);

  if (!shortCode) return null;

  const chartData = data
    ? Object.entries(data.clicksByDay).map(([day, count]) => ({
        day: day.slice(5), // MM-DD
        clicks: count,
      }))
    : [];

  return (
    <div className="panel" style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 16 }}>
            Analytics for <span className="mono" style={{ color: 'var(--accent)' }}>/{shortCode}</span>
          </h3>
        </div>
        <button className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={onClose}>
          Close
        </button>
      </div>

      {loading && <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {data && !loading && (
        <>
          <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {data.totalClicks}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-dim)' }}>Total clicks</div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: 200, marginBottom: 24 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--ink-faint)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ink-faint)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--panel-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--ink)' }}
                  />
                  <Bar dataKey="clicks" fill="var(--cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No clicks in the last 30 days yet.</p>
          )}

          <div>
            <h4 style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 10, fontWeight: 500 }}>Recent activity</h4>
            {data.recentClicks.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-faint)' }}>No clicks recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.recentClicks.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'var(--ink-dim)',
                      padding: '6px 0',
                      borderBottom: i < data.recentClicks.length - 1 ? '1px solid var(--panel-border)' : 'none',
                    }}
                  >
                    <span>{c.referer === 'direct' ? 'Direct visit' : `via ${c.referer}`}</span>
                    <span className="mono" style={{ color: 'var(--ink-faint)' }}>
                      {new Date(c.clickedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
