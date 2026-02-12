export function getDictionaryUrl(page: number, limit: number) {
  return `/api/dictionary?page=${page}&limit=${limit}`;
}
