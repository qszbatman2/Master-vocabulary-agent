import { describe, it, expect } from 'vitest';
import { fetchAllFromSupabase } from '@/lib/supabase-fetch-all';

describe('fetchAllFromSupabase', () => {
  it('should fetch all pages until a short page is returned', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({ id: i + 1 }));

    const query = {
      range: async (from: number, to: number) => {
        const data = rows.slice(from, to + 1);
        return { data, error: null };
      },
    };

    const { data, error } = await fetchAllFromSupabase(query, 1000);
    expect(error).toBeNull();
    expect(data).toHaveLength(2500);
    expect(data[0].id).toBe(1);
    expect(data[2499].id).toBe(2500);
  });

  it('should stop early on error and return the collected data', async () => {
    const query = {
      range: async (from: number, to: number) => {
        if (from >= 1000) return { data: null, error: { message: 'boom' } };
        const data = Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i + 1 }));
        return { data, error: null };
      },
    };

    const { data, error } = await fetchAllFromSupabase(query, 1000);
    expect(error?.message).toBe('boom');
    expect(data).toHaveLength(1000);
  });
});

