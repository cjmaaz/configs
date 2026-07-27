import { canonicalizeNotation } from './keyNotation.js';

export function evaluateSequence(sequence, lesson, knownLessons, { force = false } = {}) {
  const input = canonicalizeNotation(sequence);
  const expected = canonicalizeNotation(lesson.keys);

  if (input === expected) {
    return { status: 'correct', input, expected };
  }

  if (!force && expected.startsWith(input)) {
    return { status: 'pending', input, expected };
  }

  const known = knownLessons
    .filter((candidate) => candidate.kind === lesson.kind)
    .map((candidate) => canonicalizeNotation(candidate.keys));

  if (!force && known.some((candidate) => candidate.startsWith(input))) {
    return { status: 'pending', input, expected };
  }

  return { status: 'wrong', input, expected };
}

export function resolvePressedLesson(sequence, lessons, mode) {
  const input = canonicalizeNotation(sequence);
  return lessons.find((lesson) => {
    if (lesson.kind !== 'keymap' || canonicalizeNotation(lesson.keys) !== input) {
      return false;
    }
    if (!mode || lesson.mode === mode) {
      return true;
    }
    return lesson.mode.includes(mode) || lesson.mode === 'NORMAL';
  });
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function buildSession(lessons, mode, limit = 12) {
  if (mode === 'learn') {
    return lessons.slice(0, limit);
  }
  return shuffle(lessons).slice(0, limit);
}

export function nextSimulatedMode(currentMode, lesson) {
  if (lesson.id === 'modes.insert' || lesson.id === 'modes.append') {
    return 'INSERT';
  }
  if (lesson.id === 'modes.visual' || lesson.id === 'modes.visual_line') {
    return 'VISUAL';
  }
  if (lesson.id === 'modes.command') {
    return 'COMMAND';
  }
  if (lesson.id === 'modes.normal' || lesson.id === 'core.exit_terminal') {
    return 'NORMAL';
  }
  if (lesson.id === 'sf.toggle_terminal') {
    return currentMode === 'TERMINAL' ? 'NORMAL' : 'TERMINAL';
  }
  return currentMode;
}
