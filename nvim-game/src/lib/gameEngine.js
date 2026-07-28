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

export function isKnownPrefix(sequence, lessons) {
  const input = canonicalizeNotation(sequence);
  if (!input) {
    return false;
  }
  return lessons.some((lesson) => {
    const keys = canonicalizeNotation(lesson.keys);
    return keys.length > input.length && keys.startsWith(input);
  });
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

// Answer keys for setting lessons are single digits. Ten or more choices would
// make "1" a prefix of "10", so every single-digit answer would have to wait out
// the chord timeout instead of resolving on the keypress.
export const MAX_SETTING_CHOICES = 9;

/**
 * Re-key a setting lesson so the correct choice is not always in the same slot.
 * Choice order comes straight from the curriculum arrays, which puts the answer
 * on "1" or "2" for most lessons; shuffling per session makes the position
 * uninformative without touching the source data.
 */
export function withShuffledChoices(lesson, random = Math.random) {
  if (lesson.kind !== 'setting' || !lesson.choices?.length) {
    return lesson;
  }
  if (lesson.choices.length > MAX_SETTING_CHOICES) {
    throw new Error(
      `Setting lesson ${lesson.id} has ${lesson.choices.length} choices, over the ${MAX_SETTING_CHOICES} single-digit limit`,
    );
  }

  const shuffled = shuffle(lesson.choices, random);
  const correct = shuffled.findIndex((choice) => choice.value === lesson.value);
  const choices = shuffled.map((choice, index) => ({ ...choice, key: String(index + 1) }));

  return {
    ...lesson,
    keys: String(correct + 1),
    choices,
    siblings: choices.filter((_, index) => index !== correct).map((choice) => choice.key),
  };
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
