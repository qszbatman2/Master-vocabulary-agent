'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MAX_INCREMENT_SECONDS } from '@/lib/duration';

interface ClozeQuestion {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  question: string;
  options: string[];
  correctAnswer: string;
  mode: string;
  example_sentence: string;
  example_sentence_cn?: string;
}

export default function ClozePracticePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<ClozeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const questionsRef = useRef(questions);
  const currentIndexRef = useRef(currentIndex);
  const isLoadingRef = useRef(isLoading);
  const seenIdsRef = useRef<number[]>([]);
  const isExitingRef = useRef(false);

  const activeDurationMsRef = useRef(0);
  const lastActiveAtRef = useRef(0);

  const pauseActiveTimer = useCallback((now: number = Date.now()) => {
    if (lastActiveAtRef.current > 0) {
      activeDurationMsRef.current += now - lastActiveAtRef.current;
      lastActiveAtRef.current = 0;
    }
  }, []);

  const resumeActiveTimer = useCallback((now: number = Date.now()) => {
    if (lastActiveAtRef.current === 0) {
      lastActiveAtRef.current = now;
    }
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseActiveTimer();
      else resumeActiveTimer();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseActiveTimer, resumeActiveTimer]);

  const fetchMore = useCallback(
    async (excludeIds: number[]) => {
      if (!token) return;
      if (isLoadingRef.current) return;
      setIsLoading(true);
      try {
        const trimmed = excludeIds.slice(-500);
        const qs = trimmed.length ? `&excludeWordIds=${trimmed.join(',')}` : '';
        const res = await fetch(`/api/cloze?limit=20${qs}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const incoming: ClozeQuestion[] = data.questions || [];
        if (incoming.length) {
          setQuestions((prev) => [...prev, ...incoming]);
          const nextSeen = [...seenIdsRef.current, ...incoming.map((q) => q.id)];
          seenIdsRef.current = nextSeen.slice(-800);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/login');
      return;
    }
    resumeActiveTimer();
    if (questionsRef.current.length === 0) {
      fetchMore([]);
    }
  }, [user, router, fetchMore, resumeActiveTimer]);

  const exitAndSummary = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    pauseActiveTimer();
    const duration = Math.min(Math.floor(activeDurationMsRef.current / 1000), MAX_INCREMENT_SECONDS);
    const totalPracticed = correctCount + wrongCount;
    sessionStorage.setItem(
      'cloze_round_stats',
      JSON.stringify({
        totalPracticed,
        correctCount,
        wrongCount,
        duration,
      })
    );
    router.push('/practice/cloze/summary');
  }, [correctCount, wrongCount, pauseActiveTimer, router]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    const q = questionsRef.current[currentIndexRef.current];
    if (!q) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer.toLowerCase() === q.correctAnswer.toLowerCase()) setCorrectCount((c) => c + 1);
    else setWrongCount((w) => w + 1);
  };

  const nextQuestion = async () => {
    setSelectedAnswer(null);
    setShowResult(false);
    const next = currentIndexRef.current + 1;
    setCurrentIndex(next);
    const remaining = questionsRef.current.length - next;
    if (remaining < 6) {
      const exclude = seenIdsRef.current.length ? seenIdsRef.current : questionsRef.current.map((q) => q.id);
      await fetchMore(exclude);
    }
  };

  if (!user) return null;

  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#12121e' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#c44cff' }} />
          <p className="mt-3" style={{ color: '#a0a0b0' }}>加载中...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalPracticed = correctCount + wrongCount;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#12121e' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="sticky top-0 z-40 border-b backdrop-blur-xl safe-area-top" style={{ background: 'rgba(30, 30, 46, 0.9)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/practice">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">例句挖空</h1>
              <p className="text-xs" style={{ color: '#a0a0b0' }}>已做 {totalPracticed} · 正确 {correctCount}</p>
            </div>
          </div>
          <button
            onClick={exitAndSummary}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255, 107, 157, 0.12)', color: '#ff6b9d' }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="sticky z-30 px-4 py-3" style={{ top: '73px', background: 'rgba(18, 18, 30, 0.98)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-md mx-auto rounded-2xl p-5" style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}>
          <h2 className="text-xl font-bold text-white break-words">{currentQuestion.question}</h2>
        </div>
      </div>

      <div className="flex-1" style={{ paddingBottom: '320px' }} />

      <div className="fixed bottom-0 left-0 right-0 z-20" style={{ background: 'rgba(18, 18, 30, 0.98)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-md mx-auto px-4 py-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {!showResult ? (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={cn(
                    "w-full h-14 rounded-xl flex items-center gap-3 px-4 transition-all duration-200",
                    isLoaded ? 'hover:scale-[1.01] active:scale-95' : ''
                  )}
                  style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-semibold flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 text-left text-base line-clamp-2 text-white">{option}</span>
                </button>
              ))}
              {isLoading && <p className="text-xs pt-1" style={{ color: '#a0a0b0' }}>加载更多中...</p>}
            </div>
          ) : (
            <>
              <div className="overflow-y-auto mb-3" style={{ maxHeight: 'calc(60vh - 120px)' }}>
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 157, 0.1)',
                    border: `1px solid ${selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 157, 0.2)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? (
                      <CheckCircle className="w-5 h-5" style={{ color: '#00ff88' }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: '#ff6b9d' }} />
                    )}
                    <span className="font-semibold text-base" style={{ color: selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? '#00ff88' : '#ff6b9d' }}>
                      {selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? '回答正确' : '回答错误'}
                    </span>
                  </div>
                  <div className="text-base space-y-2">
                    <p>
                      <span style={{ color: '#a0a0b0' }}>正确答案：</span>
                      <span className="font-medium text-white">{currentQuestion.correctAnswer}</span>
                    </p>
                    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-base text-white">{currentQuestion.example_sentence}</p>
                      {currentQuestion.example_sentence_cn && <p className="text-sm mt-2" style={{ color: '#a0a0b0' }}>{currentQuestion.example_sentence_cn}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={nextQuestion}
                  className="w-full h-12 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.01] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}
                >
                  下一题
                </button>
                <button
                  onClick={exitAndSummary}
                  className="w-full h-11 rounded-xl font-medium transition-all duration-200 hover:scale-[1.01] active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#a0a0b0', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  结束并结算
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

