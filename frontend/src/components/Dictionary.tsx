import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getDictionaryUrl } from '../lib/api';

const PAGE_SIZE = 2000;

// Turkish alphabet: display label → lowercase char used in stored words
const TR_ALPHA: { label: string; char: string }[] = [
  { label: 'A', char: 'a' }, { label: 'B', char: 'b' }, { label: 'C', char: 'c' },
  { label: 'Ç', char: 'ç' }, { label: 'D', char: 'd' }, { label: 'E', char: 'e' },
  { label: 'F', char: 'f' }, { label: 'G', char: 'g' }, { label: 'Ğ', char: 'ğ' },
  { label: 'H', char: 'h' }, { label: 'I', char: 'ı' }, { label: 'İ', char: 'i' },
  { label: 'J', char: 'j' }, { label: 'K', char: 'k' }, { label: 'L', char: 'l' },
  { label: 'M', char: 'm' }, { label: 'N', char: 'n' }, { label: 'O', char: 'o' },
  { label: 'Ö', char: 'ö' }, { label: 'P', char: 'p' }, { label: 'R', char: 'r' },
  { label: 'S', char: 's' }, { label: 'Ş', char: 'ş' }, { label: 'T', char: 't' },
  { label: 'U', char: 'u' }, { label: 'Ü', char: 'ü' }, { label: 'V', char: 'v' },
  { label: 'Y', char: 'y' }, { label: 'Z', char: 'z' },
];

type Props = { onBack: () => void };

function Highlight({ word, query }: { word: string; query: string }) {
  if (!query) return <>{word}</>;
  const idx = word.indexOf(query);
  if (idx === -1) return <>{word}</>;
  return (
    <>
      {word.slice(0, idx)}
      <mark className="bp-dict-mark">{word.slice(idx, idx + query.length)}</mark>
      {word.slice(idx + query.length)}
    </>
  );
}

export function Dictionary({ onBack }: Props) {
  const [words, setWords]           = useState<string[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getDictionaryUrl(p, PAGE_SIZE));
      if (!res.ok) throw new Error('Failed to load dictionary');
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchLower = search.trim().toLowerCase();

  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of words) {
      const c = w.charAt(0);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [words]);

  const filtered = useMemo(() => {
    let result = words;
    if (letterFilter) result = result.filter(w => w.charAt(0) === letterFilter);
    if (searchLower)  result = result.filter(w => w.includes(searchLower));
    return result;
  }, [words, letterFilter, searchLower]);

  const isFiltered = !!searchLower || !!letterFilter;

  const handleLetterClick = (char: string) => {
    setLetterFilter(prev => prev === char ? null : char);
    setSearch('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLetterFilter(null);
  };

  return (
    <div className="bp-dict-page">

      {/* ── Header ── */}
      <div className="bp-dict-header">
        <button type="button" className="bp-btn-secondary bp-dict-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="bp-dict-title-block">
          <h1 className="bp-dict-title">Dictionary</h1>
          <span className="bp-dict-subtitle">
            {loading ? 'Loading…' : `${total.toLocaleString()} Turkish words`}
          </span>
        </div>
        <span className="bp-dict-esc-hint">ESC to go back</span>
      </div>

      {/* ── Search ── */}
      <div className="bp-dict-search-row">
        <div className="bp-dict-search-wrap">
          <span className="bp-dict-search-icon">⌕</span>
          <input
            ref={searchRef}
            type="text"
            className="bp-dict-search-input"
            placeholder="Search words…"
            value={search}
            onChange={handleSearchChange}
            autoFocus
            spellCheck={false}
          />
          {search && (
            <button
              type="button"
              className="bp-dict-clear-btn"
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            >✕</button>
          )}
        </div>
        {!loading && (
          <div className="bp-dict-result-badge">
            {isFiltered
              ? <><strong>{filtered.length.toLocaleString()}</strong> match{filtered.length !== 1 ? 'es' : ''}</>
              : <><strong>{words.length.toLocaleString()}</strong> shown · page {page}/{totalPages}</>
            }
          </div>
        )}
      </div>

      {/* ── Alphabet filter ── */}
      <div className="bp-dict-alphabet-row">
        {TR_ALPHA.map(({ label, char }) => {
          const count = letterCounts[char] ?? 0;
          const active = letterFilter === char;
          return (
            <button
              key={char}
              type="button"
              className={`bp-dict-alpha-btn${active ? ' active' : ''}${!count && !loading ? ' empty' : ''}`}
              onClick={() => handleLetterClick(char)}
              disabled={loading || (!count && !active)}
              title={count ? `${count} words` : 'No words on this page'}
            >
              {label}
              {count > 0 && <span className="bp-dict-alpha-count">{count}</span>}
            </button>
          );
        })}
        {letterFilter && (
          <button
            type="button"
            className="bp-dict-clear-filter-btn"
            onClick={() => setLetterFilter(null)}
          >✕ Clear</button>
        )}
      </div>

      {error && <p className="bp-error" style={{ margin: '0 24px' }}>{error}</p>}

      {/* ── Word grid ── */}
      <div className="bp-dict-body bp-scroll">
        {loading ? (
          <div className="bp-dict-skeleton">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="bp-dict-skeleton-chip"
                style={{ width: `${48 + (i * 37 % 60)}px` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bp-dict-empty">
            <span className="bp-dict-empty-icon">📭</span>
            <span>No words found{search ? ` for "${search}"` : letterFilter ? ` starting with ${letterFilter.toUpperCase()}` : ''}</span>
          </div>
        ) : (
          <div className="bp-dict-grid">
            {filtered.map(w => (
              <div key={w} className="bp-dict-word">
                <Highlight word={w} query={searchLower} />
                <span className="bp-dict-word-len">{w.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!isFiltered && totalPages > 1 && !loading && (
        <div className="bp-dict-pagination">
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => loadPage(1)}
            disabled={page <= 1}
          >«</button>
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1}
          >‹ Prev</button>

          <div className="bp-dict-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="bp-dict-page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`bp-dict-page-btn${p === page ? ' active' : ''}`}
                    onClick={() => loadPage(p as number)}
                  >{p}</button>
                )
              )}
          </div>

          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => loadPage(page + 1)}
            disabled={page >= totalPages}
          >Next ›</button>
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => loadPage(totalPages)}
            disabled={page >= totalPages}
          >»</button>
        </div>
      )}
    </div>
  );
}
