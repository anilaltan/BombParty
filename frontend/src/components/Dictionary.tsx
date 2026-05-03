import { useState, useEffect, useCallback } from 'react';
import { getDictionaryUrl } from '../lib/api';

const PAGE_SIZE = 2000;

type Props = { onBack: () => void };

export function Dictionary({ onBack }: Props) {
  const [words, setWords]     = useState<string[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getDictionaryUrl(p, PAGE_SIZE));
      if (!res.ok) throw new Error('Failed to load');
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) throw new Error('API returned non-JSON. Check backend/proxy config.');
      const data = await res.json();
      setWords(data.words ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchLower = search.trim().toLowerCase();
  const filtered    = searchLower ? words.filter(w => w.toLowerCase().includes(searchLower)) : words;

  return (
    <div className="bp-dict">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: 26, fontWeight: 900, color: 'white' }}>Dictionary</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>
            {loading ? 'Loading…' : `${total.toLocaleString()} Turkish words`}
          </p>
        </div>
        <button type="button" className="bp-btn-secondary" onClick={onBack}>← Back</button>
      </div>

      {/* Search */}
      <input
        type="text"
        className="bp-input"
        placeholder="Search words…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 360 }}
      />

      {error && <p className="bp-error">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Loading…</p>
      ) : (
        <>
          {search && (
            <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0 }}>
              {filtered.length} match{filtered.length !== 1 ? 'es' : ''} for "{search}"
            </p>
          )}

          <div style={{
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 4,
            fontSize: 12,
          }} className="bp-scroll">
            {filtered.map(w => (
              <div
                key={w}
                style={{
                  padding: '4px 8px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text-2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--border)',
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {!search && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                className="bp-btn-secondary"
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{page} / {totalPages}</span>
              <button
                type="button"
                className="bp-btn-secondary"
                onClick={() => loadPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
