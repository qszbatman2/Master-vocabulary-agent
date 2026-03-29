export type PracticeFilter = 'all' | 'wrong_words' | 'collected';
export type PracticeDistractorMode = 'near_form';

export function buildPracticeQuery(params: {
  categoryId: string;
  filter: PracticeFilter;
  distractorMode?: PracticeDistractorMode;
  limit: number;
  excludeWordIds?: number[];
  priorityWordIds?: number[];
}): string {
  const searchParams = new URLSearchParams();

  if (params.categoryId !== 'all') {
    searchParams.append('categoryId', params.categoryId);
  }

  if (params.filter !== 'all') {
    searchParams.append('filter', params.filter);
  }

  if (params.distractorMode) {
    searchParams.append('distractorMode', params.distractorMode);
  }

  searchParams.append('limit', String(params.limit));

  if (params.excludeWordIds && params.excludeWordIds.length > 0) {
    searchParams.append('excludeWordIds', params.excludeWordIds.join(','));
  }

  if (params.priorityWordIds && params.priorityWordIds.length > 0) {
    searchParams.append('priorityWordIds', params.priorityWordIds.join(','));
  }

  return searchParams.toString();
}
