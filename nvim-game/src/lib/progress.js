export const STORAGE_KEY = 'nvim-game.progress.v2';
export const LEGACY_STORAGE_KEY = 'nvim-game.progress.v1';

// A lesson counts as mastered only after this many consecutive correct answers,
// so the topic percentage reflects recall rather than one lucky guess.
export const MASTERY_STREAK = 2;

export const emptyProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  attempts: 0,
  correct: 0,
  byTopic: {},
  lessons: {},
};

export function emptyLessonRecord() {
  return {
    attempts: 0,
    correct: 0,
    correctStreak: 0,
    lastSeenAt: 0,
    lastCorrectAt: 0,
    mastered: false,
  };
}

export function lessonRecord(progress, lessonId) {
  return progress.lessons?.[lessonId] || emptyLessonRecord();
}

// v1 stored `mastered` as a plain id->true map with no timing information. One
// correct answer is carried over as a single-answer streak, which leaves the new
// two-answer bar one correct response away instead of discarding the history.
export function migrateLegacyProgress(legacy) {
  const lessons = {};
  for (const lessonId of Object.keys(legacy.mastered || {})) {
    if (!legacy.mastered[lessonId]) continue;
    lessons[lessonId] = { ...emptyLessonRecord(), attempts: 1, correct: 1, correctStreak: 1 };
  }
  for (const [lessonId, misses] of Object.entries(legacy.missed || {})) {
    if (!misses) continue;
    const existing = lessons[lessonId] || emptyLessonRecord();
    lessons[lessonId] = { ...existing, attempts: existing.attempts + misses };
  }

  return {
    ...emptyProgress,
    xp: legacy.xp ?? 0,
    level: legacy.level ?? 1,
    streak: legacy.streak ?? 0,
    bestStreak: legacy.bestStreak ?? 0,
    attempts: legacy.attempts ?? 0,
    correct: legacy.correct ?? 0,
    byTopic: legacy.byTopic ?? {},
    lessons,
  };
}

export function loadProgress() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...emptyProgress, ...JSON.parse(stored) };
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacyProgress(JSON.parse(legacy));
      saveProgress(migrated);
      return migrated;
    }

    return { ...emptyProgress };
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

export function recordAnswer(progress, lesson, isCorrect, now = Date.now()) {
  const streak = isCorrect ? progress.streak + 1 : 0;
  const gained = isCorrect ? 10 + Math.min(streak, 5) * 2 : 0;
  const topic = progress.byTopic[lesson.topic] || { attempts: 0, correct: 0 };
  const previous = lessonRecord(progress, lesson.id);
  const xp = progress.xp + gained;

  // A wrong answer resets the streak, so a mastered lesson drops back into the
  // unmastered pool and has to be earned again.
  const correctStreak = isCorrect ? previous.correctStreak + 1 : 0;

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
    lessons: {
      ...progress.lessons,
      [lesson.id]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (isCorrect ? 1 : 0),
        correctStreak,
        lastSeenAt: now,
        lastCorrectAt: isCorrect ? now : previous.lastCorrectAt,
        mastered: correctStreak >= MASTERY_STREAK,
      },
    },
  };

  saveProgress(next);
  return next;
}

export function isMastered(progress, lessonId) {
  return lessonRecord(progress, lessonId).mastered;
}

export function topicTotals(progress, topics, lessons) {
  return Object.fromEntries(
    topics.map((topic) => {
      const topicLessons = lessons.filter((lesson) => lesson.topic === topic.id);
      const mastered = topicLessons.filter((lesson) => isMastered(progress, lesson.id)).length;
      return [
        topic.id,
        {
          mastered,
          total: topicLessons.length,
          percent: topicLessons.length ? Math.round((mastered / topicLessons.length) * 100) : 0,
        },
      ];
    }),
  );
}

export function remainingCount(lessons, progress) {
  return lessons.filter((lesson) => !isMastered(progress, lesson.id)).length;
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return { ...emptyProgress };
}
