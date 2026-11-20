export interface Pagination {
  page: number;
  is_partial_result: boolean;
  next_page: number | null;
}

// Crisp does not report a total, so a non-empty page means another page may exist.
export function paginate<Item>(
  items: Item[],
  page: number,
): { items: Item[]; pagination: Pagination } {
  const hasMore = items.length > 0;
  return {
    items,
    pagination: { page, is_partial_result: hasMore, next_page: hasMore ? page + 1 : null },
  };
}

const MAX_COLLECTED_PAGES = 5;

export async function collectPages<Item>(
  fetchPage: (page: number) => Promise<Item[]>,
): Promise<{ items: Item[]; is_partial_result: boolean }> {
  const items: Item[] = [];
  for (let page = 1; page <= MAX_COLLECTED_PAGES; page += 1) {
    const batch = await fetchPage(page);
    if (batch.length === 0) return { items, is_partial_result: false };
    items.push(...batch);
  }
  return { items, is_partial_result: true };
}
