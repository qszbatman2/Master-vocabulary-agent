type SupabaseQueryLike<T> = {
  range: (from: number, to: number) => Promise<{ data: T[] | null; error: any | null }>;
};

/**
 * PostgREST will default to returning at most 1000 rows when no explicit range is set.
 * This helper repeatedly calls `.range()` until the full result set is retrieved.
 */
export async function fetchAllFromSupabase<T>(
  baseQuery: SupabaseQueryLike<T>,
  pageSize: number = 1000
): Promise<{ data: T[]; error: any | null }> {
  const all: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await baseQuery.range(from, to);
    if (error) return { data: all, error };

    const batch = data || [];
    all.push(...batch);

    if (batch.length < pageSize) break;
  }

  return { data: all, error: null };
}

