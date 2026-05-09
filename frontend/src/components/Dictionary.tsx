import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdBanner } from './AdBanner';
import { useI18n } from '../context/I18nContext';

const PAGE_SIZE = 2000;

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

function PageControls({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  const { t } = useI18n();
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1)
    .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === total)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="bp-dict-pagination">
      <button className="bp-dict-page-btn" onClick={() => onChange(1)}          disabled={page <= 1}>«</button>
      <button className="bp-dict-page-btn" onClick={() => onChange(page - 1)}  disabled={page <= 1}>{t.prev}</button>
      <div className="bp-dict-page-nums">
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="bp-dict-page-ellipsis">…</span>
            : <button
                key={p}
                className={`bp-dict-page-btn${p === page ? ' active' : ''}`}
                onClick={() => onChange(p as number)}
              >{p}</button>
        )}
      </div>
      <button className="bp-dict-page-btn" onClick={() => onChange(page + 1)}  disabled={page >= total}>{t.next}</button>
      <button className="bp-dict-page-btn" onClick={() => onChange(total)}      disabled={page >= total}>»</button>
    </div>
  );
}

export function Dictionary({ onBack }: Props) {
  const { t } = useI18n();

  const [allWords, setAllWords]         = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef   = useRef<HTMLDivElement>(null);

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

  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of allWords) {
      const c = w.charAt(0);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [allWords]);

  // Filtered list (all matching words, unpaged)
  const filtered = useMemo(() => {
    let result = allWords;
    if (letterFilter) result = result.filter(w => w.charAt(0) === letterFilter);
    if (searchLower)  result = result.filter(w => w.includes(searchLower));
    return result;
  }, [allWords, letterFilter, searchLower]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageWords   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changePage = (p: number) => {
    setPage(p);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLetterClick = (char: string) => {
    setLetterFilter(prev => prev === char ? null : char);
    setSearch('');
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLetterFilter(null);
    setPage(1);
  };

  return (
    <div className="bp-dict-page">

      {/* ── Header ── */}
      <div className="bp-dict-header">
        <button type="button" className="bp-btn-secondary bp-dict-back-btn" onClick={onBack}>
          {t.back}
        </button>
        <div className="bp-dict-title-block">
          <h1 className="bp-dict-title">{t.dictionaryTitle}</h1>
          <span className="bp-dict-subtitle">
            {loading ? t.loading : t.turkishWords(allWords.length.toLocaleString())}
          </span>
        </div>
        <span className="bp-dict-esc-hint">{t.escHint}</span>
      </div>

      {/* ── Search ── */}
      <div className="bp-dict-search-row">
        <div className="bp-dict-search-wrap">
          <span className="bp-dict-search-icon">⌕</span>
          <input
            ref={searchRef}
            type="text"
            className="bp-dict-search-input"
            placeholder={t.searchPlaceholder}
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
              onClick={() => { setSearch(''); setPage(1); searchRef.current?.focus(); }}
            >✕</button>
          )}
        </div>
        {!loading && (
          <div className="bp-dict-result-badge">
            {(searchLower || letterFilter)
              ? <><strong>{filtered.length.toLocaleString()}</strong> {t.matchesSuffix(filtered.length)}</>
              : <><strong>{allWords.length.toLocaleString()}</strong> {t.totalWordsSuffix}</>
            }
            {totalPages > 1 && (
              <> · {t.pageLabel} <strong>{safePage}</strong>/{totalPages}</>
            )}
          </div>
        )}
      </div>

      {/* ── Alphabet filter ── */}
      <div className="bp-dict-alphabet-row">
        {TR_ALPHA.map(({ label, char }) => {
          const count  = letterCounts[char] ?? 0;
          const active = letterFilter === char;
          return (
            <button
              key={char}
              type="button"
              className={`bp-dict-alpha-btn${active ? ' active' : ''}${!count && !loading ? ' empty' : ''}`}
              onClick={() => handleLetterClick(char)}
              disabled={loading || count === 0}
              title={loading ? t.loading : count ? t.letterWords(count.toLocaleString()) : t.noWords}
            >
              {label}
              {!loading && count > 0 && (
                <span className="bp-dict-alpha-count">
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          );
        })}
        {(letterFilter || searchLower) && (
          <button
            type="button"
            className="bp-dict-clear-filter-btn"
            onClick={() => { setLetterFilter(null); setSearch(''); setPage(1); }}
          >{t.clear}</button>
        )}
      </div>

      {error && <p className="bp-error" style={{ margin: '0 24px' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <AdBanner slot="DICT_SLOT_ID" format="rectangle" />
      </div>

      {/* ── Word grid ── */}
      <div className="bp-dict-body bp-scroll" ref={bodyRef}>
        {loading ? (
          <div className="bp-dict-skeleton">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="bp-dict-skeleton-chip" style={{ width: `${48 + (i * 37 % 72)}px` }} />
            ))}
          </div>
        ) : pageWords.length === 0 ? (
          <div className="bp-dict-empty">
            <span className="bp-dict-empty-icon">📭</span>
            <span>
              {search ? t.noWordsFoundFor(search) : t.noWordsFound}
            </span>
          </div>
        ) : (
          <div className="bp-dict-grid">
            {pageWords.map(w => (
              <div key={w} className="bp-dict-word">
                <Highlight word={w} query={searchLower} />
                <span className="bp-dict-word-len">{w.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination (always shown when more than one page) ── */}
      {!loading && (
        <PageControls page={safePage} total={totalPages} onChange={changePage} />
      )}
    </div>
  );
}
