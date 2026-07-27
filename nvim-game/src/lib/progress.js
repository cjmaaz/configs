import { shuffle } from './gameEngine.js';

export const STORAGE_KEY = 'nvim-game.progress.v1';

export const emptyProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  attempts: 0,
  correct: 0,
  byTopic: {},
  missed: {},
  mastered: {},
};

export function loadProgress() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...emptyProgress, ...JSON.parse(stored) } : { ...emptyProgress };
  } catch {
    return { ...emptyProgress };
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in hardened/private contexts; gameplay remains usable.
  }
}

export function recordAnswer(progress, lesson, isCorrect) {
  const streak = isCorrect ? progress.streak + 1 : 0;
  const gained = isCorrect ? 10 + Math.min(streak, 5) * 2 : 0;
  const topic = progress.byTopic[lesson.topic] || { attempts: 0, correct: 0 };
  const misses = progress.missed[lesson.id] || 0;
  const xp = progress.xp + gained;

  const next = {
    ...progress,
    xp,
    level: Math.floor(xp / 200) + 1,
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    attempts: progress.attempts + 1,
    correct: progress.correct + (isCorrect ? 1 : 0),
    byTopic: {
      ...progress.byTopic,
      [lesson.topic]: {
        attempts: topic.attempts + 1,
        correct: topic.correct + (isCorrect ? 1 : 0),
      },
    },
    missed: {
      ...progress.missed,
      [lesson.id]: isCorrect ? Math.max(0, misses - 1) : misses + 1,
    },
    mastered: {
      ...progress.mastered,
      ...(isCorrect ? { [lesson.id]: true } : {}),
    },
  };

  saveProgress(next);
  return next;
}

export function masteryByTopic(progress, topics, lessons) {
  return Object.fromEntries(
    topics.map((topic) => {
      const topicLessons = lessons.filter((lesson) => lesson.topic === topic.id);
      const mastered = topicLessons.filter((lesson) => progress.mastered?.[lesson.id]).length;
      const mastery = topicLessons.length ? Math.round((mastered / topicLessons.length) * 100) : 0;
      return [topic.id, mastery];
    }),
  );
}

export function prioritizedPractice(lessons, progress, limit = 12) {
  const shuffled = shuffle(lessons);
  return shuffled
    .sort((left, right) => (progress.missed[right.id] || 0) - (progress.missed[left.id] || 0))
    .slice(0, limit);
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return { ...emptyProgress };
}
