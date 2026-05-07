'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_FILTERS = ['all', 'active', 'pending', 'archived'];

const TIER_LABELS = {
  memorial: 'Memorial',
  family: 'Family Altar',
};

const BILLING_LABELS = {
  monthly: '/mo',
  yearly: '/yr',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function yearFrom(str) {
  if (!str) return null;
  return new Date(str).getUTCFullYear();
}

function formatLifeDates(birth, death) {
  const b = yearFrom(birth);
  const d = yearFrom(death);
  if (b && d) return b + ' – ' + d;
  if (b) return 'b. ' + b;
  if (d) return 'd. ' + d;
  return '—';
}

function StatusBadge({ status }) {
  return <span className={'admin-badge admin-badge-' + status}>{status}</span>;
}

function SubBadge({ sub }) {
  if (!sub) return <span className="admin-badge admin-badge-none">No sub</span>;
  const label = ((TIER_LABELS[sub.tier] || sub.tier || '?') + ' ' + (BILLING_LABELS[sub.billing_interval] || '')).trim();
  const cls = sub.status === 'active' ? 'active' : sub.status === 'canceled' ? 'archived' : 'pending';
  return <span className={'admin-badge admin-badge-' + cls}>{label}</span>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [memorials, setMemorials] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchMemorials = useCallback(async (status) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/memorials?status=' + status);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setMemorials(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load memorials.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchMemorials(filter); }, [filter, fetchMemorials]);

  async function updateStatus(id, status) {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/memorials/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMemorials((prev) =>
          filter === 'all'
            ? prev.map((m) => (m.id === id ? { ...m, status } : m))
            : prev.filter((m) => m.id !== id)
        );
      }
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  const counts = {
    active: memorials.filter((m) => m.status === 'active').length,
    pending: memorials.filter((m) => m.status === 'pending').length,
    archived: memorials.filter((m) => m.status === 'archived').length,
  };

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/logo-original-botanica.svg" alt="Original Botanica" className="admin-logo" />
          <span className="admin-header-title">Ancestor Altar Admin</span>
        </div>
        <a href="/api/admin/logout" className="admin-logout-btn">Sign Out</a>
      </header>

      <main className="admin-main">
        {filter === 'all' && !loading && (
          <div className="admin-stats">
            <div className="admin-stat"><div className="admin-stat-num">{counts.active}</div><div className="admin-stat-label">Active</div></div>
            <div className="admin-stat"><div className="admin-stat-num">{counts.pending}</div><div className="admin-stat-label">Pending</div></div>
            <div className="admin-stat"><div className="admin-stat-num">{counts.archived}</div><div className="admin-stat-label">Archived</div></div>
            <div className="admin-stat"><div className="admin-stat-num">{memorials.length}</div><div className="admin-stat-label">Total</div></div>
          </div>
        )}

        <div className="admin-filters">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={'admin-filter-btn' + (filter === s ? ' active' : '')}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && <p className="admin-error">{error}</p>}

        {loading ? (
          <div className="admin-loading">Loading memorials...</div>
        ) : memorials.length === 0 ? (
          <div className="admin-empty">No memorials found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th><th>Status</th><th>Subscription</th><th>Dates</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memorials.map((m) => {
                  const sub = m.subscriptions?.[0] || null;
                  const isActing = actionLoading === m.id;
                  return (
                    <tr key={m.id} className={'admin-row admin-row-' + m.status}>
                      <td className="admin-col-name">
                        <a href={'/candle/' + m.hash} target="_blank" rel="noopener noreferrer" className="admin-name-link">{m.name}</a>
                        {m.is_private && <span className="admin-private-tag">private</span>}
                      </td>
                      <td><StatusBadge status={m.status} /></td>
                      <td><SubBadge sub={sub} /></td>
                      <td className="admin-col-dates">{formatLifeDates(m.birth_date, m.death_date)}</td>
                      <td className="admin-col-date">{formatDate(m.created_at)}</td>
                      <td className="admin-col-actions">
                        {m.status !== 'active' && (
                          <button onClick={() => updateStatus(m.id, 'active')} disabled={isActing} className="admin-action-btn admin-action-restore">
                            {isActing ? '...' : 'Restore'}
                          </button>
                        )}
                        {m.status !== 'archived' && (
                          <button onClick={() => updateStatus(m.id, 'archived')} disabled={isActing} className="admin-action-btn admin-action-archive">
                            {isActing ? '...' : 'Archive'}
                          </button>
                        )}
                        <a href={'/candle/' + m.hash} target="_blank" rel="noopener noreferrer" className="admin-action-btn admin-action-view">View</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
