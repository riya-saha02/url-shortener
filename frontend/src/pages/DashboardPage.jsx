import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { urlApi } from '../api/client';
import BrandMark from '../components/BrandMark';
import UrlForm from '../components/UrlForm';
import UrlList from '../components/UrlList';
import AnalyticsPanel from '../components/AnalyticsPanel';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);

  const loadUrls = () => {
    setLoading(true);
    urlApi
      .list()
      .then((res) => setUrls(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUrls();
  }, []);

  const handleCreated = (newUrl) => {
    setUrls((prev) => [newUrl, ...prev]);
  };

  const handleDeactivated = (code) => {
    setUrls((prev) => prev.map((u) => (u.shortCode === code ? { ...u, active: false } : u)));
    if (selectedCode === code) setSelectedCode(null);
  };

  const totalClicks = urls.reduce((sum, u) => sum + u.clickCount, 0);

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand">
          <BrandMark className="brand-mark" />
          snip<span className="cut">.</span>
        </span>
        <div className="topbar-right">
          <span>{user?.name}</span>
          <button className="btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 26 }}>Your links</h1>
          {urls.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
              {urls.length} link{urls.length === 1 ? '' : 's'} · {totalClicks} total click{totalClicks === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <UrlForm onCreated={handleCreated} />

        {loading ? (
          <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Loading your links…</p>
        ) : (
          <UrlList
            urls={urls}
            onSelect={(code) => setSelectedCode(code === selectedCode ? null : code)}
            selectedCode={selectedCode}
            onDeactivated={handleDeactivated}
          />
        )}

        <AnalyticsPanel shortCode={selectedCode} onClose={() => setSelectedCode(null)} />
      </div>
    </div>
  );
}
