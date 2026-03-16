import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('24');

  const headers = { Authorization: `Bearer ${token}` };

  const login = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/stats`, { headers });
      setStats(res.data);
      setAuthed(true);
    } catch {
      alert('Invalid admin token');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/stats`, { headers });
      setStats(res.data);
    } catch {}
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/reports?status=pending`, { headers });
      setReports(res.data.reports || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (authed) {
      const interval = setInterval(fetchStats, 5000);
      fetchReports();
      return () => clearInterval(interval);
    }
  }, [authed]);

  const handleBan = async () => {
    if (!banIp) return;
    try {
      await axios.post(`${API}/api/admin/ban`, {
        ip: banIp, reason: banReason, durationHours: parseInt(banDuration),
      }, { headers });
      alert('Banned successfully');
      setBanIp(''); setBanReason('');
    } catch {
      alert('Ban failed');
    }
  };

  const handleReportAction = async (id, status) => {
    try {
      await axios.post(`${API}/api/admin/reports/${id}/action`, { status }, { headers });
      fetchReports();
    } catch {}
  };

  const inputStyle = {
    background: 'var(--surface-overlay)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
  };

  if (!authed) {
    return (
      <>
        <Head><title>Admin — Addagle</title></Head>
        <div className="min-h-screen flex items-center justify-center" style={{ zIndex: 1, position: 'relative' }}>
          <div className="glass rounded-2xl p-8 w-full max-w-sm" style={{ border: '1px solid var(--border)' }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Admin Access</h1>
            </div>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Admin JWT token..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            <button onClick={login}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', fontFamily: 'var(--font-display)' }}>
              Login →
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Admin Dashboard — Addagle</title></Head>
      <div className="min-h-screen relative" style={{ zIndex: 1 }}>
        <nav className="flex items-center justify-between px-6 py-4 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>A</div>
            </Link>
            <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Admin Dashboard</span>
          </div>
          <div className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', color: '#22d3a5' }}>
            🟢 Authenticated
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">

          {/* Tab nav */}
          <div className="flex gap-2 mb-6">
            {['overview', 'reports', 'ban'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                style={{
                  background: tab === t ? 'rgba(98,114,241,0.2)' : 'var(--surface-raised)',
                  border: `1px solid ${tab === t ? 'var(--brand)' : 'var(--border)'}`,
                  color: tab === t ? 'white' : 'var(--text-muted)',
                }}>
                {t === 'overview' ? '📊' : t === 'reports' ? '🚩' : '🔨'} {t}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Users', value: stats.activeUsers, icon: '👥' },
                  { label: 'Waiting', value: stats.waitingUsers, icon: '⌛' },
                  { label: 'Active Pairs', value: stats.activePairs, icon: '💬' },
                  { label: 'Pending Reports', value: reports.length, icon: '🚩' },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{s.value}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Last updated: {stats.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'N/A'} · Auto-refreshes every 5s
              </p>
            </motion.div>
          )}

          {/* Reports */}
          {tab === 'reports' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Pending Reports ({reports.length})
                </h2>
                <button onClick={fetchReports} className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  🔄 Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>✅ No pending reports</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reports.map(r => (
                    <div key={r._id} className="glass rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                              {r.reason}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Date(r.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-sm" style={{ color: 'var(--text)' }}>{r.description}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Reported IP: {r.reportedIp || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleReportAction(r._id, 'actioned')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                            Ban
                          </button>
                          <button onClick={() => handleReportAction(r._id, 'dismissed')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Ban tool */}
          {tab === 'ban' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 max-w-md" style={{ border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                🔨 Ban by IP
              </h2>
              <div className="flex flex-col gap-3">
                <input value={banIp} onChange={e => setBanIp(e.target.value)}
                  placeholder="IP address..."
                  className="px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                <input value={banReason} onChange={e => setBanReason(e.target.value)}
                  placeholder="Reason..."
                  className="px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                  className="px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                  <option value="720">30 days</option>
                  <option value="87600">Permanent</option>
                </select>
                <button onClick={handleBan}
                  className="py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}>
                  Apply Ban
                </button>
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </>
  );
}
