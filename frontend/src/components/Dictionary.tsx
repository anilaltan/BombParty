import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const DISPLAY_PAGE_SIZE = 2000;

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
  const [allWords, setAllWords]         = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [displayPage, setDisplayPage]   = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dictionary?page=1&limit=200000');
      if (!res.ok) throw new Error('Failed to load dictionary');
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) throw new Error('API returned non-JSON. Check backend/proxy config.');
      const data = await res.json();
      setAllWords(data.words ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack]);

  const searchLower = search.trim().toLowerCase();
  const isFiltered  = !!searchLower || !!letterFilter;

  // Letter counts across the FULL dictionary
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of allWords) {
      const c = w.charAt(0);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [allWords]);

  // Filtered list used for display
  const filtered = useMemo(() => {
    let result = allWords;
    if (letterFilter) result = result.filter(w => w.charAt(0) === letterFilter);
    if (searchLower)  result = result.filter(w => w.includes(searchLower));
    return result;
  }, [allWords, letterFilter, searchLower]);

  // Pagination only applies to the unfiltered full list
  const displayWords = useMemo(() => {
    if (isFiltered) return filtered;
    const start = (displayPage - 1) * DISPLAY_PAGE_SIZE;
    return allWords.slice(start, start + DISPLAY_PAGE_SIZE);
  }, [isFiltered, filtered, allWords, displayPage]);

  const totalDisplayPages = Math.max(1, Math.ceil(allWords.length / DISPLAY_PAGE_SIZE));

  const handleLetterClick = (char: string) => {
    setLetterFilter(prev => prev === char ? null : char);
    setSearch('');
    setDisplayPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLetterFilter(null);
    setDisplayPage(1);
  };

  const goToPage = (p: number) => {
    setDisplayPage(p);
    setLetterFilter(null);
    setSearch('');
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
            {loading ? 'Loading…' : `${allWords.length.toLocaleString()} Turkish words`}
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
            placeholder="Search all words…"
            value={search}
            onChange={handleSearchChange}
            autoFocus
            spellCheck={false}
            disabled={loading}
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
              : <><strong>{displayWords.length.toLocaleString()}</strong> shown · page {displayPage}/{totalDisplayPages}</>
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
              disabled={loading || count === 0}
              title={loading ? 'Loading…' : count ? `${count.toLocaleString()} words` : 'No words'}
            >
              {label}
              {!loading && count > 0 && (
                <span className="bp-dict-alpha-count">{count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}</span>
              )}
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
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="bp-dict-skeleton-chip"
                style={{ width: `${48 + (i * 37 % 72)}px` }}
              />
            ))}
          </div>
        ) : displayWords.length === 0 ? (
          <div className="bp-dict-empty">
            <span className="bp-dict-empty-icon">📭</span>
            <span>
              {search
                ? `No words found for "${search}"`
                : letterFilter
                  ? `No words starting with that letter`
                  : 'No words loaded'}
            </span>
          </div>
        ) : (
          <div className="bp-dict-grid">
            {displayWords.map(w => (
              <div key={w} className="bp-dict-word">
                <Highlight word={w} query={searchLower} />
                <span className="bp-dict-word-len">{w.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination (unfiltered view only) ── */}
      {!isFiltered && totalDisplayPages > 1 && !loading && (
        <div className="bp-dict-pagination">
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => goToPage(1)}
            disabled={displayPage <= 1}
          >«</button>
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => goToPage(displayPage - 1)}
            disabled={displayPage <= 1}
          >‹ Prev</button>

          <div className="bp-dict-page-nums">
            {Array.from({ length: totalDisplayPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - displayPage) <= 2 || p === 1 || p === totalDisplayPages)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="bp-dict-page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`bp-dict-page-btn${p === displayPage ? ' active' : ''}`}
                    onClick={() => goToPage(p as number)}
                  >{p}</button>
                )
              )}
          </div>

          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => goToPage(displayPage + 1)}
            disabled={displayPage >= totalDisplayPages}
          >Next ›</button>
          <button
            type="button"
            className="bp-dict-page-btn"
            onClick={() => goToPage(totalDisplayPages)}
            disabled={displayPage >= totalDisplayPages}
          >»</button>
        </div>
      )}
    </div>
  );
}
