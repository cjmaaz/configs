import { shuffle } from './gameEngine.js';
import { lessonRecord } from './progress.js';

export const SESSION_LENGTHS = [
  { id: '12', label: '12', size: 12 },
  { id: '25', label: '25', size: 25 },
  { id: '50', label: '50', size: 50 },
  { id: 'all', label: 'All remaining', size: Infinity },
];

export const FRESH = 'fresh';
export const LEARNING = 'learning';
export const REVIEW = 'review';

// Tier a lesson by how much work it still needs. Fresh lessons come first so a
// selection can always be finished, learning lessons next, and mastered lessons
// only once nothing else is left.
export function tierFor(lesson, progress) {
  const record = lessonRecord(progress, lesson.id);
  if (!record.lastSeenAt) return FRESH;
  if (!record.mastered) return LEARNING;
  return REVIEW;
}

export function partitionByTier(lessons, progress) {
  const buckets = { [FRESH]: [], [LEARNING]: [], [REVIEW]: [] };
  for (const lesson of lessons) {
    buckets[tierFor(lesson, progress)].push(lesson);
  }
  return buckets;
}

function byLeastProgress(progress) {
  return (left, right) => {
    const a = lessonRecord(progress, left.id);
    const b = lessonRecord(progress, right.id);
    if (a.correctStreak !== b.correctStreak) return a.correctStreak - b.correctStreak;
    return a.lastSeenAt - b.lastSeenAt;
  };
}

function bySolvedEarliest(progress) {
  return (left, right) =>
    lessonRecord(progress, left.id).lastCorrectAt - lessonRecord(progress, right.id).lastCorrectAt;
}

/**
 * Choose the lessons for one session.
 *
 * Selection is tiered so unmastered work always wins, but the chosen set is
 * shuffled before it is returned: practising the same topic repeatedly should
 * not train the order of the questions alongside the answers.
 */
export function selectSession(lessons, progress, size = 12, random = Math.random) {
  if (!lessons.length) return [];

  const buckets = partitionByTier(lessons, progress);
  const ordered = [
    ...shuffle(buckets[FRESH], random),
    // Shuffle first so that lessons tied on streak and timestamp are not always
    // drawn in curriculum order.
    ...shuffle(buckets[LEARNING], random).sort(byLeastProgress(progress)),
    ...shuffle(buckets[REVIEW], random).sort(bySolvedEarliest(progress)),
  ];

  const limit = Number.isFinite(size) ? Math.max(1, size) : ordered.length;
  return shuffle(ordered.slice(0, limit), random);
}

/**
 * Lessons still short of mastery. "All remaining" uses this so the option means
 * "everything I have left" rather than "every question in the topic".
 */
export function unmasteredLessons(lessons, progress) {
  const buckets = partitionByTier(lessons, progress);
  return [...buckets[FRESH], ...buckets[LEARNING]];
}

export function sessionSizeFor(lengthId, lessons, progress) {
  if (lengthId === 'all') {
    return Math.max(1, unmasteredLessons(lessons, progress).length || lessons.length);
  }
  const option = SESSION_LENGTHS.find((entry) => entry.id === lengthId);
  return option ? option.size : 12;
}
