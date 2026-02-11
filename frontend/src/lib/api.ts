const API_BASE =
  import.meta.env.VITE_SOCKET_URL ??
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001');

export function getDictionaryUrl(page: number, limit: number) {
  return `${API_BASE}/api/dictionary?page=${page}&limit=${limit}`;
}
