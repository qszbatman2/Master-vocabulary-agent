export type StatsHistoryPoint = {
  date: string;
  totalPracticed: number;
  effectiveCompletedCount: number;
  wrongCount: number;
  masteredCount: number;
  durationMinutes: number;
  isSettled: boolean;
  hasStudyActivity: boolean;
  wrongWordCount: number;
};

export type StatsDashboardResponse = {
  today: {
    date: string;
    practicedCount: number;
    masteredCount: number;
    effectiveCompletedCount: number;
    hasStudyActivity: boolean;
  };
  dailyProgress: {
    dailyGoal: number;
    effectiveCompletedCount: number;
    progress: number;
    isCompleted: boolean;
  };
  total: {
    totalWords: number;
    masteredCount: number;
    reviewingCount: number;
    learningCount: number;
    newWordsCount: number;
  };
  ladder: { counts: number[] };
  categories: {
    items: Array<{
      categoryId: number | null;
      name: string;
      totalWords: number;
      libraryShare: number;
      practicedWords: number;
      masteredWords: number;
      wrongSum: number;
      masteredRate: number;
    }>;
    totalCategories: number;
  };
  weakWords: Array<{
    wordId: number;
    word: string;
    meaning: string | null;
    phonetic: string | null;
    categoryName: string | null;
    wrongCount: number;
    correctCount: number;
    lastWrongAt: string | null;
  }>;
  history: StatsHistoryPoint[];
};
