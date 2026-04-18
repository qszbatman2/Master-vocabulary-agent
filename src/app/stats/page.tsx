'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Gauge, Layers, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type DashboardResponse = {
  today: {
    date: string;
    practicedCount: number;
    masteredCount: number;
    completedCount: number;
  };
  dailyProgress: {
    dailyGoal: number;
    completed: number;
    progress: number;
    isCompleted: boolean;
  };
  total: {
    totalWords: number;
    masteredCount: number;
    reviewingCount: number;
    newWordsCount: number;
  };
  ladder: { counts: number[] };
  categories: {
    top: Array<{
      categoryId: number | null;
      name: string;
      totalWords: number;
      practicedWords: number;
      masteredWords: number;
      wrongSum: number;
      masteredRate: number;
    }>;
    totalCategories: number;
    rest: {
      totalWords: number;
      practicedWords: number;
      masteredWords: number;
      wrongSum: number;
    };
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
  history: Array<{
    date: string;
    totalPracticed: number;
    correctCount: number;
    completedCount: number;  // 有效答对单词数（基于 last_correct_date，与每日学习目标逻辑一致）
    wrongCount: number;
    masteredCount: number;
    durationMinutes: number;
    isSettled: boolean;
    wrongWordCount: number;
  }>;
};

function shanghaiDateString(date: Date): string {
  const shanghaiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

function formatCompact(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function toPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function buildConicSegments(segments: Array<{ value: number; color: string }>): string {
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  if (total <= 0) return 'conic-gradient(rgba(255,255,255,0.08) 0deg 360deg)';

  let cursor = 0;
  const stops: string[] = [];
  for (const s of segments) {
    const v = Math.max(0, s.value);
    const angle = (v / total) * 360;
    const start = cursor;
    const end = cursor + angle;
    if (angle > 0.2) stops.push(`${s.color} ${start}deg ${end}deg`);
    cursor = end;
  }
  if (cursor < 360) stops.push(`rgba(255,255,255,0.08) ${cursor}deg 360deg`);
  return `conic-gradient(${stops.join(',')})`;
}

function intensityToBg(intensity: number): string {
  const t = clamp01(intensity);
  const a = 0.10 + t * 0.55;
  return `rgba(0, 240, 255, ${a.toFixed(3)})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
}

function rgbText([r, g, b]: [number, number, number], alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cloudColor(intensity: number): string {
  const t = clamp01(intensity);
  const low: [number, number, number] = [160, 160, 176];
  const mid: [number, number, number] = [0, 240, 255];
  const high: [number, number, number] = [255, 107, 157];
  if (t < 0.5) return rgbText(mixRgb(low, mid, t / 0.5), 0.95);
  return rgbText(mixRgb(mid, high, (t - 0.5) / 0.5), 0.95);
}

function achievedColor(intensity: number): string {
  const t = clamp01(intensity);
  const low: [number, number, number] = [0, 255, 136];
  const high: [number, number, number] = [0, 212, 255];
  return rgbText(mixRgb(low, high, t), 0.96);
}

function notAchievedColor(intensity: number): string {
  const t = clamp01(intensity);
  const low: [number, number, number] = [70, 36, 90];
  const high: [number, number, number] = [255, 107, 157];
  return rgbText(mixRgb(low, high, t), 0.96);
}

type CloudItem = {
  id: number;
  word: string;
  wrongCount: number;
  correctCount: number;
  lastWrongAt: string | null;
  categoryName: string | null;
  meaning: string | null;
  phonetic: string | null;
  t: number;
  fontSize: number;
  rotate: 0 | 90;
};

type CloudPlacedItem = CloudItem & {
  cx: number;
  cy: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

function approxTextBox(word: string, fontSize: number, rotate: 0 | 90): { w: number; h: number } {
  const baseW = Math.max(1, word.length) * fontSize * 0.62 + 10;
  const baseH = fontSize * 1.15 + 10;
  if (rotate === 90) return { w: baseH, h: baseW };
  return { w: baseW, h: baseH };
}

function layoutWordCloud(items: CloudItem[], width: number, height: number): CloudPlacedItem[] {
  if (width <= 0 || height <= 0) return [];
  const margin = 2;
  const cx = width / 2;
  const cy = height / 2;
  const cell = 32;
  const grid = new Map<string, number[]>();
  const placed: CloudPlacedItem[] = [];

  const keyOf = (gx: number, gy: number) => `${gx},${gy}`;
  const cellsFor = (r: { x: number; y: number; w: number; h: number }) => {
    const x0 = Math.floor(r.x / cell);
    const y0 = Math.floor(r.y / cell);
    const x1 = Math.floor((r.x + r.w) / cell);
    const y1 = Math.floor((r.y + r.h) / cell);
    return { x0, y0, x1, y1 };
  };

  const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const collides = (rect: { x: number; y: number; w: number; h: number }) => {
    const { x0, y0, x1, y1 } = cellsFor(rect);
    for (let gy = y0; gy <= y1; gy += 1) {
      for (let gx = x0; gx <= x1; gx += 1) {
        const ids = grid.get(keyOf(gx, gy));
        if (!ids) continue;
        for (const idx of ids) {
          if (intersects(rect, placed[idx])) return true;
        }
      }
    }
    return false;
  };

  const addToGrid = (rect: { x: number; y: number; w: number; h: number }, idx: number) => {
    const { x0, y0, x1, y1 } = cellsFor(rect);
    for (let gy = y0; gy <= y1; gy += 1) {
      for (let gx = x0; gx <= x1; gx += 1) {
        const k = keyOf(gx, gy);
        const list = grid.get(k);
        if (list) list.push(idx);
        else grid.set(k, [idx]);
      }
    }
  };

  const sorted = [...items].sort((a, b) => b.fontSize - a.fontSize);

  for (const it of sorted) {
    const box = approxTextBox(it.word, it.fontSize, it.rotate);
    const maxSteps = 4200;
    let ok: CloudPlacedItem | null = null;

    for (let s = 0; s < maxSteps; s += 1) {
      const a = 0.24 * s;
      const r = 1.15 * a;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const rect = { x: x - box.w / 2, y: y - box.h / 2, w: box.w, h: box.h };

      if (rect.x < margin || rect.y < margin || rect.x + rect.w > width - margin || rect.y + rect.h > height - margin) continue;
      if (collides(rect)) continue;

      ok = { ...it, cx: x, cy: y, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
      break;
    }

    if (!ok) continue;
    const idx = placed.length;
    placed.push(ok);
    addToGrid({ x: ok.x, y: ok.y, w: ok.w, h: ok.h }, idx);
  }

  if (placed.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of placed) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }

    const dxIdeal = (width - (maxX - minX)) / 2 - minX;
    const dyIdeal = (height - (maxY - minY)) / 2 - minY;
    const dxMin = margin - minX;
    const dxMax = width - margin - maxX;
    const dyMin = margin - minY;
    const dyMax = height - margin - maxY;
    const dx = Math.max(dxMin, Math.min(dxIdeal, dxMax));
    const dy = Math.max(dyMin, Math.min(dyIdeal, dyMax));

    if (dx !== 0 || dy !== 0) {
      for (const p of placed) {
        p.x += dx;
        p.y += dy;
        p.cx += dx;
        p.cy += dy;
      }
    }
  }

  return placed;
}

type CloudBox = {
  id: number;
  word: string;
  wrongCount: number;
  correctCount: number;
  lastWrongAt: string | null;
  categoryName: string | null;
  meaning: string | null;
  phonetic: string | null;
  t: number;
  vertical: boolean;
  spanX: number;
  spanY: number;
};

type CloudPlaced = CloudBox & { x: number; y: number };

function packCloud(items: CloudBox[], cols: number): { placed: CloudPlaced[]; rows: number } {
  const sorted = [...items].sort((a, b) => b.spanX * b.spanY - a.spanX * a.spanY);
  const placed: CloudPlaced[] = [];
  let rows = 0;
  const grid: boolean[][] = [];

  const ensureRows = (targetRows: number) => {
    while (rows < targetRows) {
      grid.push(Array.from({ length: cols }, () => false));
      rows += 1;
    }
  };

  const canPlace = (x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0) return false;
    if (x + w > cols) return false;
    ensureRows(y + h);
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (grid[yy][xx]) return false;
      }
    }
    return true;
  };

  const placeAt = (item: CloudBox, x: number, y: number) => {
    ensureRows(y + item.spanY);
    for (let yy = y; yy < y + item.spanY; yy += 1) {
      for (let xx = x; xx < x + item.spanX; xx += 1) {
        grid[yy][xx] = true;
      }
    }
    placed.push({ ...item, x, y });
  };

  for (const item of sorted) {
    let done = false;
    for (let y = 0; y < rows + 24 && !done; y += 1) {
      for (let x = 0; x <= cols - item.spanX; x += 1) {
        if (canPlace(x, y, item.spanX, item.spanY)) {
          placeAt(item, x, y);
          done = true;
          break;
        }
      }
    }
    if (!done) placeAt(item, 0, rows);
  }

  return { placed, rows };
}

type TreemapItem = {
  id: string;
  name: string;
  totalWords: number;
  masteredRate: number;
  masteredWords: number;
  practicedWords: number;
  wrongSum: number;
};

type TreemapRect = TreemapItem & { x: number; y: number; w: number; h: number };

function splitTreemap(items: TreemapItem[], x: number, y: number, w: number, h: number, horizontal: boolean): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];

  const total = items.reduce((acc, it) => acc + Math.max(0, it.totalWords), 0) || 1;
  let acc = 0;
  let idx = 0;
  for (; idx < items.length; idx += 1) {
    acc += Math.max(0, items[idx].totalWords);
    if (acc >= total / 2) break;
  }
  const a = items.slice(0, idx + 1);
  const b = items.slice(idx + 1);
  const aTotal = a.reduce((t, it) => t + Math.max(0, it.totalWords), 0);
  const ratio = aTotal / total;

  if (horizontal) {
    const h1 = h * ratio;
    return [...splitTreemap(a, x, y, w, h1, !horizontal), ...splitTreemap(b, x, y + h1, w, h - h1, !horizontal)];
  }

  const w1 = w * ratio;
  return [...splitTreemap(a, x, y, w1, h, !horizontal), ...splitTreemap(b, x + w1, y, w - w1, h, !horizontal)];
}

function buildMockDashboard(dateString: string): DashboardResponse {
  const totalWords = 13628;
  const masteredCount = 4820;
  const reviewingCount = 938;
  const newWordsCount = 6820;

  const dailyGoal = 200;
  const completed = 136;
  const progress = Math.min(100, Math.round((completed / dailyGoal) * 100));

  const days = 84;
  const base = new Date(`${dateString}T00:00:00+08:00`);

  const history = Array.from({ length: days }).map((_, i) => {
    const d = new Date(base.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const date = shanghaiDateString(d);
    const wave = Math.sin((i / 7) * Math.PI * 2);
    const wave2 = Math.sin((i / 31) * Math.PI * 2);
    const seed = (i * 9301 + 49297) % 233280;
    const noise = seed / 233280;
    const practicedBase = 74 + wave * 36 + wave2 * 18 + noise * 28;
    const totalPracticed = Math.max(0, Math.round(practicedBase));
    const wrongCount = Math.max(0, Math.round(totalPracticed * (0.06 + noise * 0.06)));
    const correctCount = Math.max(0, totalPracticed - wrongCount);
    const masteredCountDaily = Math.max(0, Math.round(totalPracticed * (0.03 + wave2 * 0.01)));
    const durationMinutes = Math.max(0, Math.round(totalPracticed * (0.32 + noise * 0.12)));
    const wrongWordCount = Math.min(wrongCount, Math.max(0, Math.round(3 + noise * 11)));
    // Mock 数据中 completedCount 等于 correctCount（简化处理）
    const completedCount = correctCount;

    return {
      date,
      totalPracticed,
      correctCount,
      completedCount,
      wrongCount,
      masteredCount: masteredCountDaily,
      durationMinutes,
      isSettled: i < days - 1,
      wrongWordCount,
    };
  });

  const today = history[history.length - 1];

  const categoriesTop = [
    { categoryId: 2, name: 'CET-6 高频', totalWords: 4200, masteredWords: 1360, practicedWords: 2280, wrongSum: 1680 },
    { categoryId: 1, name: 'CET-4 高频', totalWords: 3100, masteredWords: 1780, practicedWords: 2340, wrongSum: 920 },
    { categoryId: 3, name: '雅思核心', totalWords: 1900, masteredWords: 620, practicedWords: 980, wrongSum: 840 },
    { categoryId: 4, name: '托福核心', totalWords: 1500, masteredWords: 540, practicedWords: 860, wrongSum: 720 },
    { categoryId: 6, name: '阅读高频', totalWords: 1200, masteredWords: 700, practicedWords: 910, wrongSum: 430 },
    { categoryId: 5, name: '商务英语', totalWords: 900, masteredWords: 420, practicedWords: 620, wrongSum: 360 },
    { categoryId: 7, name: '写作替换', totalWords: 600, masteredWords: 320, practicedWords: 450, wrongSum: 210 },
    { categoryId: null, name: '未分类', totalWords: 228, masteredWords: 80, practicedWords: 140, wrongSum: 70 },
  ].map((c) => ({
    ...c,
    masteredRate: c.totalWords > 0 ? c.masteredWords / c.totalWords : 0,
  }));

  const weakWords: DashboardResponse['weakWords'] = [
    { wordId: 101, word: 'sustain', meaning: '维持；支撑', phonetic: 'səˈsteɪn', categoryName: '雅思核心', wrongCount: 18, correctCount: 24, lastWrongAt: dateString },
    { wordId: 102, word: 'constrain', meaning: '限制；约束', phonetic: 'kənˈstreɪn', categoryName: '托福核心', wrongCount: 16, correctCount: 19, lastWrongAt: dateString },
    { wordId: 103, word: 'adhere', meaning: '遵守；黏附', phonetic: 'ədˈhɪr', categoryName: '阅读高频', wrongCount: 15, correctCount: 21, lastWrongAt: dateString },
    { wordId: 104, word: 'prevail', meaning: '盛行；获胜', phonetic: 'prɪˈveɪl', categoryName: 'CET-6 高频', wrongCount: 14, correctCount: 18, lastWrongAt: dateString },
    { wordId: 105, word: 'subtle', meaning: '微妙的', phonetic: 'ˈsʌt(ə)l', categoryName: 'CET-4 高频', wrongCount: 13, correctCount: 26, lastWrongAt: dateString },
    { wordId: 106, word: 'allocate', meaning: '分配；划拨', phonetic: 'ˈæləkeɪt', categoryName: '商务英语', wrongCount: 12, correctCount: 17, lastWrongAt: dateString },
    { wordId: 107, word: 'precede', meaning: '在…之前；先于', phonetic: 'prɪˈsiːd', categoryName: '写作替换', wrongCount: 11, correctCount: 16, lastWrongAt: dateString },
    { wordId: 108, word: 'pursue', meaning: '追求；从事', phonetic: 'pərˈsuː', categoryName: '阅读高频', wrongCount: 11, correctCount: 23, lastWrongAt: dateString },
    { wordId: 109, word: 'inevitable', meaning: '不可避免的', phonetic: 'ɪnˈevɪtəb(ə)l', categoryName: '雅思核心', wrongCount: 10, correctCount: 22, lastWrongAt: dateString },
    { wordId: 110, word: 'specify', meaning: '具体说明', phonetic: 'ˈspesɪfaɪ', categoryName: 'CET-4 高频', wrongCount: 10, correctCount: 34, lastWrongAt: dateString },
    { wordId: 111, word: 'comply', meaning: '遵守；顺从', phonetic: 'kəmˈplaɪ', categoryName: '商务英语', wrongCount: 9, correctCount: 15, lastWrongAt: dateString },
    { wordId: 112, word: 'assess', meaning: '评估；评价', phonetic: 'əˈses', categoryName: 'CET-6 高频', wrongCount: 9, correctCount: 28, lastWrongAt: dateString },
    { wordId: 113, word: 'distinct', meaning: '明显不同的', phonetic: 'dɪˈstɪŋkt', categoryName: '阅读高频', wrongCount: 9, correctCount: 27, lastWrongAt: dateString },
    { wordId: 114, word: 'convey', meaning: '表达；传达', phonetic: 'kənˈveɪ', categoryName: '写作替换', wrongCount: 8, correctCount: 20, lastWrongAt: dateString },
    { wordId: 115, word: 'justify', meaning: '证明…正当', phonetic: 'ˈdʒʌstɪfaɪ', categoryName: '雅思核心', wrongCount: 8, correctCount: 14, lastWrongAt: dateString },
    { wordId: 116, word: 'derive', meaning: '源自；推导', phonetic: 'dɪˈraɪv', categoryName: '托福核心', wrongCount: 8, correctCount: 13, lastWrongAt: dateString },
    { wordId: 117, word: 'promote', meaning: '促进；推广', phonetic: 'prəˈməʊt', categoryName: 'CET-4 高频', wrongCount: 8, correctCount: 31, lastWrongAt: dateString },
    { wordId: 118, word: 'considerable', meaning: '相当大的', phonetic: 'kənˈsɪd(ə)rəb(ə)l', categoryName: 'CET-6 高频', wrongCount: 7, correctCount: 19, lastWrongAt: dateString },
    { wordId: 119, word: 'reinforce', meaning: '加强；巩固', phonetic: 'ˌriːɪnˈfɔːrs', categoryName: '托福核心', wrongCount: 7, correctCount: 16, lastWrongAt: dateString },
    { wordId: 120, word: 'enhance', meaning: '增强；提高', phonetic: 'ɪnˈhɑːns', categoryName: '商务英语', wrongCount: 7, correctCount: 18, lastWrongAt: dateString },
    { wordId: 121, word: 'abstract', meaning: '抽象的', phonetic: 'ˈæbstrækt', categoryName: '阅读高频', wrongCount: 7, correctCount: 11, lastWrongAt: dateString },
    { wordId: 122, word: 'precise', meaning: '精确的', phonetic: 'prɪˈsaɪs', categoryName: '写作替换', wrongCount: 6, correctCount: 21, lastWrongAt: dateString },
    { wordId: 123, word: 'eliminate', meaning: '消除；淘汰', phonetic: 'ɪˈlɪmɪneɪt', categoryName: 'CET-6 高频', wrongCount: 6, correctCount: 12, lastWrongAt: dateString },
    { wordId: 124, word: 'prioritize', meaning: '确定优先级', phonetic: 'praɪˈɔːrətaɪz', categoryName: '商务英语', wrongCount: 6, correctCount: 10, lastWrongAt: dateString },
    { wordId: 125, word: 'implement', meaning: '实施；执行', phonetic: 'ˈɪmplɪment', categoryName: '托福核心', wrongCount: 6, correctCount: 14, lastWrongAt: dateString },
    { wordId: 126, word: 'criteria', meaning: '标准；准则', phonetic: 'kraɪˈtɪəriə', categoryName: '雅思核心', wrongCount: 5, correctCount: 16, lastWrongAt: dateString },
    { wordId: 127, word: 'relevant', meaning: '相关的', phonetic: 'ˈreləv(ə)nt', categoryName: 'CET-4 高频', wrongCount: 5, correctCount: 29, lastWrongAt: dateString },
    { wordId: 128, word: 'approximate', meaning: '大约；近似的', phonetic: 'əˈprɒksɪmət', categoryName: 'CET-6 高频', wrongCount: 5, correctCount: 12, lastWrongAt: dateString },
    { wordId: 129, word: 'notwithstanding', meaning: '尽管', phonetic: 'ˌnɒtwɪðˈstændɪŋ', categoryName: '写作替换', wrongCount: 5, correctCount: 7, lastWrongAt: dateString },
    { wordId: 130, word: 'counterpart', meaning: '对应的人/物', phonetic: 'ˈkaʊntəpɑːt', categoryName: '阅读高频', wrongCount: 4, correctCount: 13, lastWrongAt: dateString },
  ];

  return {
    today: {
      date: dateString,
      practicedCount: today.totalPracticed,
      masteredCount: today.masteredCount,
      completedCount: completed,
    },
    dailyProgress: {
      dailyGoal,
      completed,
      progress,
      isCompleted: completed >= dailyGoal,
    },
    total: {
      totalWords,
      masteredCount,
      reviewingCount,
      newWordsCount,
    },
    ladder: { counts: [3200, 2100, 1700, 1200, 880] },
    categories: {
      top: categoriesTop.slice(0, 12),
      totalCategories: 9,
      rest: {
        totalWords: 0,
        practicedWords: 0,
        masteredWords: 0,
        wrongSum: 0,
      },
    },
    weakWords,
    history,
  };
}

export default function StatsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cloudRef = useRef<HTMLDivElement | null>(null);
  const [cloudSize, setCloudSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [selectedCell, setSelectedCell] = useState<{ date: string; correctCount: number; wrong: number; mastered: number; isFuture: boolean } | null>(null);
  const [tipsPosition, setTipsPosition] = useState<{ x: number; y: number } | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#12121e' }}>
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="sticky top-0 z-40 backdrop-blur-xl safe-area-top" style={{ background: 'rgba(30, 30, 46, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-2xl w-full mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </Link>
              <div className="text-base font-bold text-white">数据面板</div>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
          <div className="rounded-3xl p-6 text-center" style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}>
            <div className="text-white font-medium mb-2">需要登录</div>
            <div className="text-sm" style={{ color: '#a0a0b0' }}>
              登录后可查看你的学习数据统计
            </div>
            <div className="mt-5">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)' }}
              >
                去登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/stats/dashboard?days=84', { headers: { authorization: `Bearer ${token}` } });
        if (!res.ok) {
          setError('数据加载失败');
          return;
        }
        setData(await res.json());
      } catch {
        setError('数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const orbit = useMemo(() => {
    if (!data) return null;
    const totalWords = data.total.totalWords || 0;
    const mastered = data.total.masteredCount || 0;
    const reviewing = data.total.reviewingCount || 0;
    const newWords = data.total.newWordsCount || 0;
    const inProgress = Math.max(0, totalWords - mastered - reviewing - newWords);

    const ringBg = buildConicSegments([
      { value: mastered, color: 'rgba(0, 255, 136, 0.95)' },
      { value: reviewing, color: 'rgba(255, 107, 157, 0.95)' },
      { value: inProgress, color: 'rgba(0, 212, 255, 0.85)' },
      { value: newWords, color: 'rgba(124, 77, 255, 0.85)' },
    ]);

    const masteredRate = totalWords > 0 ? mastered / totalWords : 0;

    return {
      totalWords,
      mastered,
      reviewing,
      inProgress,
      newWords,
      ringBg,
      masteredRate,
    };
  }, [data]);

  // 计算累计打卡天数（completedCount > 0 的天数，即有效答对的单词数 > 0）
  const streakDays = useMemo(() => {
    if (!data?.history) return 0;
    return data.history.filter(h => h.completedCount > 0).length;
  }, [data]);

  // 计算连续打卡天数（必须从今天开始算起）
  const consecutiveDays = useMemo(() => {
    if (!data?.history || data.history.length === 0) return 0;

    // 获取今天的日期字符串
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 检查今天是否有打卡记录（completedCount > 0）
    const todayRecord = data.history.find(h => h.date === todayStr);
    if (!todayRecord || todayRecord.completedCount === 0) {
      return 0; // 今天没打卡，连续天数为0
    }

    // 从今天往前推算连续天数
    const dateSet = new Set(data.history.filter(h => h.completedCount > 0).map(h => h.date));
    let count = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        count++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [data]);

  const heatmap = useMemo(() => {
    if (!data) return null;
    const days = 42; // 6周
    const base = new Date(`${data.today.date}T00:00:00+08:00`);
    const map = new Map(data.history.map((r) => [r.date, r]));

    // 找到今天之前的最近一个周日
    const todayDayOfWeek = base.getDay(); // 0-6, 0 is Sunday
    const daysToSunday = todayDayOfWeek;
    const lastSunday = new Date(base.getTime() - daysToSunday * 24 * 60 * 60 * 1000);

    // 从上周日开始，往前推足够周数，确保覆盖42天
    const weeksNeeded = 6;
    const startDate = new Date(lastSunday.getTime() - (weeksNeeded - 1) * 7 * 24 * 60 * 60 * 1000);

    const records = Array.from({ length: days }).map((_, i) => {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = shanghaiDateString(d);
      const r = map.get(key);
      const practice = r?.totalPracticed || 0;
      const correctCount = r?.correctCount || 0;
      const completedCount = r?.completedCount || 0;  // 有效答对单词数
      const wrong = r?.wrongCount || 0;
      const mastered = r?.masteredCount || 0;
      return { date: key, practice, correctCount, completedCount, wrong, mastered };
    });

    const values = records.map((r) => r.practice);
    const max = Math.max(1, ...values);
    const p95 = (() => {
      const sorted = [...values].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      return Math.max(1, sorted[Math.min(sorted.length - 1, idx)]);
    })();

    const denom = Math.max(1, Math.min(max, p95));
    const goalWords = data.dailyProgress.dailyGoal || 200;

    const todayStr = data.today.date;
    const cells = records.map((r) => {
      const v = r.practice;
      const correctV = r.correctCount;
      const completedV = r.completedCount;  // 有效答对单词数
      const t = clamp01(v / denom);
      // 达标判断使用有效答对单词数（基于 last_correct_date），与每日学习目标逻辑一致
      const achieved = completedV >= goalWords;
      const isFuture = r.date > todayStr;

      // 根据练习量、达标状态和是否未来日期确定格子颜色和样式
      // 1. 未来日期 → 更浅的灰色背景 + 虚线边框
      // 2. 无数据 (v === 0) → 浅灰色
      // 3. 有数据且达标 (achieved = true) → 绿色系 achievedColor
      // 4. 有数据但未达标 (achieved = false) → 粉色系 notAchievedColor
      let bg: string;
      let borderStyle: string;
      let opacity: number;

      if (isFuture) {
        bg = 'rgba(255,255,255,0.02)';
        borderStyle = 'dashed';
        opacity = 0.4;
      } else if (v === 0) {
        bg = 'rgba(255,255,255,0.04)';
        borderStyle = 'solid';
        opacity = 1;
      } else if (achieved) {
        bg = achievedColor(t);
        borderStyle = 'solid';
        opacity = 1;
      } else {
        bg = notAchievedColor(t);
        borderStyle = 'solid';
        opacity = 1;
      }

      return {
        ...r,
        value: v,
        bg,
        intensity: t,
        achieved,
        isFuture,
        borderStyle,
        opacity,
      };
    });

    const any = records.some((r) => r.practice > 0);
    return { days, cells, denom, goalWords, any };
  }, [data]);

  // 点击其他地方关闭 tooltip
  useEffect(() => {
    const handleClickOutside = () => setSelectedCell(null);
    if (selectedCell) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedCell]);

  useEffect(() => {
    const el = cloudRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(0, Math.floor(el.offsetWidth || el.getBoundingClientRect().width));
      const h = Math.max(0, Math.floor(el.offsetHeight || el.getBoundingClientRect().height));
      setCloudSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const cloudLayout = useMemo(() => {
    const list = (data?.weakWords || []).slice(0, 30).sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
    if (!data || list.length === 0) return null;
    const w = cloudSize.w > 0 ? cloudSize.w : 320;
    const h = cloudSize.h > 0 ? cloudSize.h : 220;

    const max = Math.max(1, ...list.map((x) => x.wrongCount || 0));
    const min = Math.min(...list.map((x) => x.wrongCount || 0));
    const denom = Math.max(1, max - min);
    const items: CloudItem[] = list.map((w) => {
      const t = clamp01(((w.wrongCount || 0) - min) / denom);
      const seed = (w.wordId * 9301 + (w.wrongCount || 0) * 49297) % 233280;
      const r = seed / 233280;
      const rotate: 0 | 90 = r < 0.28 ? 90 : 0;
      const fontSize = Math.round(14 + t * 32);
      return {
        id: w.wordId,
        word: w.word,
        wrongCount: w.wrongCount,
        correctCount: w.correctCount,
        lastWrongAt: w.lastWrongAt,
        categoryName: w.categoryName,
        meaning: w.meaning,
        phonetic: w.phonetic,
        t,
        fontSize,
        rotate,
      };
    });

    return layoutWordCloud(items, w, h);
  }, [cloudSize.h, cloudSize.w, data]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: '#12121e' }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-[520px] h-[520px] rounded-full blur-[110px]"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff)', opacity: 0.18 }}
        />
        <div
          className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full blur-[110px]"
          style={{ background: 'linear-gradient(135deg, #00f0ff, #7c4dff)', opacity: 0.12 }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-[480px] h-[480px] rounded-full blur-[110px]"
          style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', opacity: 0.14 }}
        />
      </div>

      <div className="sticky top-0 z-40 backdrop-blur-xl safe-area-top" style={{ background: 'rgba(30, 30, 46, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95" style={{ background: 'rgba(255,255,255,0.05)', color: '#a0a0b0' }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <div className="text-base font-bold text-white">数据面板</div>
              <div className="text-xs" style={{ color: '#a0a0b0' }}>
                {data?.today.date || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 pb-10 pt-6 max-w-2xl w-full mx-auto">
        {error && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: 'rgba(255, 107, 157, 0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
            <div className="text-sm text-white">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-5">
          <div
            className="relative rounded-3xl p-6 overflow-hidden"
            style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4" style={{ color: '#a0a0b0' }} />
              <div className="text-sm font-medium" style={{ color: '#a0a0b0' }}>
                学习结构
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-[118px] h-[118px]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: orbit?.ringBg || 'rgba(255,255,255,0.06)' }}
                />
                <div
                  className="absolute inset-[12px] rounded-full flex items-center justify-center text-center"
                  style={{ background: '#1e1e2e', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <div className="text-2xl font-bold text-white">{orbit ? toPercent(orbit.masteredRate) : '—'}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#a0a0b0' }}>
                      掌握率
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                {orbit && (
                  <>
                    {[
                      { name: '已掌握', value: orbit.mastered, color: '#00ff88', bg: 'rgba(0, 255, 136, 0.08)' },
                      { name: '复习中', value: orbit.reviewing, color: '#ff6b9d', bg: 'rgba(255, 107, 157, 0.08)' },
                      { name: '推进中', value: orbit.inProgress, color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.08)' },
                      { name: '未开始', value: orbit.newWords, color: '#7c4dff', bg: 'rgba(124, 77, 255, 0.10)' },
                    ].map((x) => (
                      <div key={x.name} className="rounded-2xl p-3" style={{ background: x.bg }}>
                        <div className="flex items-center justify-between">
                          <div className="text-xs" style={{ color: '#a0a0b0' }}>
                            {x.name}
                          </div>
                          <div className="text-xs font-medium" style={{ color: x.color }}>
                            {formatCompact(x.value)}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${orbit.totalWords > 0 ? Math.min(100, (x.value / orbit.totalWords) * 100) : 0}%`,
                              background: `linear-gradient(135deg, ${x.color}, rgba(255,255,255,0.10))`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {!orbit && (
                  <div className="col-span-2 text-sm" style={{ color: '#a0a0b0' }}>
                    {loading ? '加载中…' : '暂无数据'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 打卡统计卡片 */}
        <div className="flex items-center justify-center gap-8 p-4 mb-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.14)' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: '#a0a0b0' }} className="text-sm">累计</span>
            <span className="text-xl font-bold" style={{ color: '#4ade80' }}>{streakDays}</span>
            <span style={{ color: '#a0a0b0' }} className="text-sm">天</span>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#a0a0b0' }} className="text-sm">连续</span>
            <span className="text-xl font-bold" style={{ color: '#fbbf24' }}>{consecutiveDays}</span>
            <span style={{ color: '#a0a0b0' }} className="text-sm">天</span>
          </div>
        </div>

        <div
          className="rounded-3xl p-6 mb-5 overflow-hidden"
          style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
        >
          <div className="flex items-center mb-5">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4" style={{ color: '#a0a0b0' }} />
              <div className="text-sm font-medium" style={{ color: '#a0a0b0' }}>
                近 6 周热力图
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-full md:w-auto pb-1 -mx-1 px-1">
              {!heatmap ? (
                <div
                  className="rounded-2xl p-5 text-center min-w-max"
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                >
                  <div className="text-white font-medium">加载中…</div>
                </div>
              ) : !heatmap.any ? (
                <div
                  className="rounded-2xl p-5 text-center min-w-max"
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                >
                  <div className="text-white font-medium">还没有可展示的数据</div>
                  <div className="text-xs mt-2" style={{ color: '#a0a0b0' }}>
                    开始练习后，这里会生成你的 6 周热力图
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {(() => {
                    // 将42天分成6周，每行7天，首列为周日
                    const weeks: Array<typeof heatmap.cells> = [];
                    for (let i = 0; i < 6; i++) {
                      const weekCells = heatmap.cells.slice(i * 7, (i + 1) * 7);
                      weeks.push(weekCells);
                    }
                    return weeks.map((weekCells, weekIdx) => (
                      <div key={weekIdx} className="grid grid-cols-7 gap-1">
                        {weekCells.map((c) => (
                          <button
                            key={c.date}
                            onClick={() => {
                              if (!c.isFuture && c.practice > 0) {
                                setSelectedCell({ date: c.date, correctCount: c.correctCount, wrong: c.wrong, mastered: c.mastered, isFuture: c.isFuture });
                                setTipsPosition({ x: 0, y: 0 });
                              }
                            }}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-sm transition-all duration-200 ${!c.isFuture && c.practice > 0 ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                            style={{
                              background: c.bg,
                              opacity: c.opacity,
                              borderWidth: c.borderStyle === 'dashed' ? 1 : 0,
                              borderStyle: c.borderStyle,
                              borderColor: 'rgba(255,255,255,0.15)',
                              boxShadow: c.borderStyle === 'solid' ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="w-full md:flex-1">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: '#a0a0b0' }}>
                    目标：{heatmap?.goalWords || 200} 词/天
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded" style={{ background: 'rgba(255,255,255,0.02)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }} />
                      <div className="text-[11px]" style={{ color: '#a0a0b0' }}>
                        未来
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded" style={{ background: notAchievedColor(0.65), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }} />
                      <div className="text-[11px]" style={{ color: '#a0a0b0' }}>
                        未达标
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded" style={{ background: achievedColor(0.65), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }} />
                      <div className="text-[11px]" style={{ color: '#a0a0b0' }}>
                        达标
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { label: '最近 7 天', value: 7 },
                    { label: '最近 14 天', value: 14 },
                    { label: '最近 28 天', value: 28 },
                    { label: '最近 42 天', value: 42 },
                  ].map((x) => {
                    const slice = heatmap?.cells.slice(-x.value) || [];
                    const sum = slice.reduce((acc, r) => acc + r.practice, 0);
                    const avg = slice.length ? sum / slice.length : 0;
                    return (
                      <div key={x.label} className="rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.14)' }}>
                        <div className="text-[11px]" style={{ color: '#a0a0b0' }}>
                          {x.label}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <div className="text-lg font-bold text-white">
                            {formatCompact(sum)}
                          </div>
                          <div className="text-xs" style={{ color: '#a0a0b0' }}>
                            {formatCompact(Math.round(avg))}/天
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 日期详情 Tooltip */}
              {selectedCell && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCell(null);
                  }}
                >
                  <div
                    className="rounded-2xl p-4 max-w-[280px] w-full mx-4"
                    style={{
                      background: '#1e1e2e',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-sm font-semibold text-white mb-3">
                      {(() => {
                        const [year, month, day] = selectedCell.date.split('-');
                        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
                      })()}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: '#a0a0b0' }}>
                          正确答题
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#00ff88' }}>
                          {selectedCell.correctCount} 个
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: '#a0a0b0' }}>
                          答错次数
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#ff6b9d' }}>
                          {selectedCell.wrong} 次
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: '#a0a0b0' }}>
                          掌握单词
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#00d4ff' }}>
                          {selectedCell.mastered} 个
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-full mt-4 py-2 rounded-xl text-xs font-medium text-white transition-all duration-200 active:scale-98"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      onClick={() => setSelectedCell(null)}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              )}

              {(() => {
                const counts = data?.ladder.counts || [0, 0, 0, 0, 0];
                const total = counts.reduce((acc, x) => acc + (x || 0), 0) || 1;
                const mastery = (counts[4] || 0) / total;
                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs" style={{ color: '#a0a0b0' }}>
                        掌握度
                      </div>
                      <div className="text-xs font-medium" style={{ color: '#00ff88' }}>
                        {toPercent(mastery)}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {counts.map((count, step) => {
                        const color = step === 4 ? '#00ff88' : step === 0 ? '#7c4dff' : '#00f0ff';
                        const bg = step === 4 ? 'rgba(0, 255, 136, 0.08)' : step === 0 ? 'rgba(124, 77, 255, 0.10)' : 'rgba(0, 240, 255, 0.08)';
                        const label = step === 4 ? '已掌握' : `${step}天`;
                        return (
                          <div key={step} className="rounded-2xl py-2.5 text-center" style={{ background: bg }}>
                            <div className="text-[11px]" style={{ color: '#a0a0b0' }}>
                              {label}
                            </div>
                            <div className="text-base font-bold mt-1" style={{ color }}>
                              {formatCompact(count)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div
            className="rounded-3xl p-6 overflow-hidden"
            style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm font-medium" style={{ color: '#a0a0b0' }}>
                分类概览
              </div>
              <div className="text-xs" style={{ color: '#a0a0b0' }}>
                Top {data?.categories.top.length || 0} / {data?.categories.totalCategories || 0}
              </div>
            </div>

            {(() => {
              const top = data?.categories.top || [];
              const rest = data?.categories.rest || { totalWords: 0, practicedWords: 0, masteredWords: 0, wrongSum: 0 };
              if (!data || top.length === 0) {
                return (
                  <div className="text-sm" style={{ color: '#a0a0b0' }}>
                    {loading ? '加载中…' : '暂无分类数据'}
                  </div>
                );
              }

              const main = top.slice(0, 9);
              const list = rest.totalWords > 0 ? [...main, { categoryId: -1 as any, name: '其他', totalWords: rest.totalWords, practicedWords: rest.practicedWords, masteredWords: rest.masteredWords, wrongSum: rest.wrongSum, masteredRate: rest.totalWords > 0 ? rest.masteredWords / rest.totalWords : 0 }] : main;
              const items: TreemapItem[] = list
                .map((c) => ({
                  id: String(c.categoryId),
                  name: c.name,
                  totalWords: c.totalWords || 0,
                  masteredRate: clamp01(c.masteredRate || 0),
                  masteredWords: c.masteredWords || 0,
                  practicedWords: c.practicedWords || 0,
                  wrongSum: c.wrongSum || 0,
                }))
                .sort((a, b) => b.totalWords - a.totalWords);

              const total = items.reduce((acc, c) => acc + Math.max(0, c.totalWords), 0) || 1;
              const rects = splitTreemap(items, 0, 0, 100, 100, true);

              const base = '#00f0ff';
              const dirFor = (name: string, idx: number): 'ltr' | 'rtl' => {
                if (name.includes('CET-6')) return 'rtl';
                if (name.includes('雅思')) return 'ltr';
                return idx % 2 === 0 ? 'ltr' : 'rtl';
              };

              const palette = ['#00f0ff', '#7c4dff', '#00ff88', '#ff6b9d', '#00d4ff', '#c44cff', '#4cc9ff', '#ffd166'];

              return (
                <div>
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      height: 220,
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    {rects.map((r, idx) => {
                      const color = palette[idx % palette.length];
                      const showText = r.w >= 18 && r.h >= 16;
                      const dir = dirFor(r.name, idx);
                      const fillW = `${Math.round(r.masteredRate * 100 * 100) / 100}%`;
                      return (
                        <div
                          key={r.id}
                          className="absolute overflow-hidden"
                          style={{
                            left: `${r.x}%`,
                            top: `${r.y}%`,
                            width: `${r.w}%`,
                            height: `${r.h}%`,
                            background: 'rgba(0,0,0,0.14)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                          }}
                          title={`${r.name}\n${r.masteredWords}/${r.totalWords}`}
                        >
                          <div
                            className="absolute inset-y-0"
                            style={{
                              left: dir === 'rtl' ? 'auto' : '0',
                              right: dir === 'rtl' ? '0' : 'auto',
                              width: fillW,
                              background: dir === 'rtl' ? `linear-gradient(270deg, ${color}, ${color}33)` : `linear-gradient(90deg, ${color}, ${color}33)`,
                              opacity: 0.92,
                            }}
                          />
                          {showText && (
                            <div className="relative p-2">
                              <div className="text-xs font-semibold text-white truncate">{r.name}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: '#a0a0b0' }}>
                                {r.masteredWords}/{r.totalWords}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {items.map((c, idx) => {
                      const color = palette[idx % palette.length];
                      return (
                        <div
                          key={`${c.id}-compact`}
                          className="rounded-2xl px-3 py-2"
                          style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                          title={`${c.name}\n${c.masteredWords}/${c.totalWords}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                            <div className="text-[11px] font-medium" style={{ color }}>{formatCompact(c.masteredWords)}/{formatCompact(c.totalWords)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            className="rounded-3xl p-6 overflow-hidden"
            style={{ background: '#1e1e2e', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <TriangleAlert className="w-4 h-4" style={{ color: '#a0a0b0' }} />
              <div className="text-sm font-medium" style={{ color: '#a0a0b0' }}>
                错词列表 Top30
              </div>
            </div>

            {(() => {
              const list = (data?.weakWords || []).slice(0, 30).sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
              if (!data || list.length === 0) {
                return (
                  <div className="text-sm" style={{ color: '#a0a0b0' }}>
                    {loading ? '加载中…' : '暂无错词数据'}
                  </div>
                );
              }

              const maxWrong = Math.max(1, ...list.map((w) => w.wrongCount || 0));

              return (
                <div className="space-y-2">
                  {list.map((w, idx) => {
                    const wrongCount = w.wrongCount || 0;
                    const correctCount = w.correctCount || 0;
                    const percentage = clamp01(wrongCount / maxWrong);
                    const barColor = percentage > 0.7 ? '#ff6b9d' : percentage > 0.4 ? '#ff8a5b' : '#ffa600';

                    return (
                      <div
                        key={w.wordId}
                        className="rounded-2xl px-4 py-3 relative overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                        }}
                        title={`${w.word}\n错: ${wrongCount}  对: ${correctCount}\n最近错: ${w.lastWrongAt || '—'}\n分类: ${w.categoryName || '—'}\n${w.meaning || ''}`}
                      >
                        <div
                          className="absolute inset-y-0 left-0"
                          style={{
                            width: `${percentage * 100}%`,
                            background: `linear-gradient(90deg, ${barColor}22, transparent)`,
                            pointerEvents: 'none',
                          }}
                        />
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-bold" style={{ color: '#7c4dff', width: 24 }}>
                              {idx + 1}
                            </div>
                            <div className="text-sm font-semibold text-white">{w.word}</div>
                            <div className="text-xs truncate max-w-[120px]" style={{ color: '#a0a0b0' }}>
                              {w.meaning}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                background: `${barColor}22`,
                                color: barColor,
                              }}
                            >
                              错 {wrongCount} 次
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
