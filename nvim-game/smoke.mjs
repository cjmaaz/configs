import assert from 'node:assert/strict';
import {
  activeLessons,
  allLessons,
  curriculumStats,
  lessonsForTopics,
  topics,
} from './src/data/curriculum/index.js';
import {
  MAX_SETTING_CHOICES,
  evaluateSequence,
  isKnownPrefix,
  withShuffledChoices,
} from './src/lib/gameEngine.js';
import {
  createEditorState,
  validateEditorState,
} from './src/lib/editorState.js';
import {
  applyLessonEffect,
  explicitEffectIds,
  resolveLessonEffect,
} from './src/lib/effects.js';
import { canonicalizeNotation, tokenizeNotation } from './src/lib/keyNotation.js';
import { emptyProgress, recordAnswer, remainingCount, topicTotals } from './src/lib/progress.js';
import { selectSession, sessionSizeFor, unmasteredLessons } from './src/lib/scheduler.js';
import { VISUAL_SETTINGS } from './src/lib/visualSettings.js';

const ids = new Set(allLessons.map((lesson) => lesson.id));
assert.equal(ids.size, allLessons.length, 'lesson IDs must be unique');
assert.ok(curriculumStats.total >= 120, 'curriculum should cover at least 120 active challenges');
assert.ok(curriculumStats.settings >= 25, 'settings curriculum is incomplete');
assert.ok(curriculumStats.topics >= 10, 'active topic count is incomplete');
assert.ok(activeLessons.every((lesson) => !lesson.inactive), 'inactive lesson leaked into active pool');
assert.ok(
  activeLessons.filter((lesson) => lesson.topic === 'neotree').length >= 7,
  'active Neo-tree curriculum is incomplete',
);

for (const lesson of allLessons) {
  assert.ok(lesson.id && lesson.topic && lesson.keys && lesson.label && lesson.prompt);
  assert.ok(lesson.explains, `${lesson.id} needs an explanation`);
  if (lesson.kind === 'setting') {
    assert.ok(lesson.choices.length >= 2, `${lesson.id} needs setting alternatives`);
    assert.ok(lesson.choices.some((choice) => choice.key === lesson.keys));
  }
}

const required = [
  '<leader>sf',
  '<leader>fe',
  '<leader>ge',
  '<leader>hs',
  '<leader>rn',
  '<leader>f',
  '<leader>cl',
  '<leader>co',
  '<leader>cR',
  '<leader>SF',
  '<leader>Sr',
  '<leader>ST',
  '<leader>Ss',
  '[v',
  ']v',
  '<Esc><Esc>',
];
for (const keys of required) {
  assert.ok(
    activeLessons.some((lesson) => canonicalizeNotation(lesson.keys) === canonicalizeNotation(keys)),
    `missing required mapping ${keys}`,
  );
}

const findFiles = activeLessons.find((lesson) => lesson.id === 'telescope.files');
assert.equal(evaluateSequence('<leader>s', findFiles, activeLessons).status, 'pending');
assert.equal(evaluateSequence('<leader>sf', findFiles, activeLessons).status, 'correct');
assert.equal(
  evaluateSequence('<leader>sg', findFiles, activeLessons, { force: true }).status,
  'wrong',
);

// <Esc><Esc> must stay reachable: the first Escape is a pending prefix, and
// the full pair is accepted. Regression guard for Escape-cancels-chord.
const exitTerminal = activeLessons.find((lesson) => lesson.id === 'core.exit_terminal');
assert.equal(evaluateSequence('<Esc>', exitTerminal, activeLessons).status, 'pending');
assert.equal(evaluateSequence('<Esc><Esc>', exitTerminal, activeLessons).status, 'correct');
assert.ok(isKnownPrefix('<Esc>', activeLessons), '<Esc> must be a known prefix');
assert.ok(!isKnownPrefix('<Esc><Esc>', activeLessons), 'completed chord is not a prefix');

assert.equal(canonicalizeNotation('<S-h>'), 'H');
assert.deepEqual(tokenizeNotation('<leader>sf'), ['<leader>', 's', 'f']);
assert.ok(lessonsForTopics(['salesforce']).length >= 25);

// Setting answers are single digits. A tenth choice would make "1" a prefix of
// "10", so every single-digit answer would wait out the chord timeout instead of
// resolving on the keypress -- the same failure mode as the <Esc><Esc> bug.
for (const lesson of activeLessons.filter((item) => item.kind === 'setting')) {
  assert.ok(
    lesson.choices.length <= MAX_SETTING_CHOICES,
    `${lesson.id} has ${lesson.choices.length} choices, over the single-digit limit`,
  );
}

// A web page cannot intercept these, so they must never be an expected answer.
const browserReserved = ['<C-w>', '<C-t>', '<C-n>', '<C-q>'];
for (const lesson of activeLessons.filter((item) => item.kind === 'keymap')) {
  for (const chord of browserReserved) {
    assert.ok(
      !canonicalizeNotation(lesson.keys).includes(chord),
      `${lesson.id} uses ${chord}, which the browser reserves`,
    );
  }
}

// Choice labels are always visible, unlike effects. Every question in the
// defaults topic asks what the built-in value is, so a correct label containing
// "default" would hand over the answer.
for (const lesson of activeLessons.filter((item) => item.topic === 'defaults')) {
  const correct = lesson.choices.find((choice) => choice.value === lesson.value);
  assert.ok(
    correct && !/default/i.test(correct.label),
    `${lesson.id} labels its correct choice "${correct?.label}", which gives the answer away`,
  );
}

// Shuffling the choices must move the answer without breaking it.
for (const lesson of activeLessons.filter((item) => item.kind === 'setting')) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shuffled = withShuffledChoices(lesson);
    assert.equal(
      evaluateSequence(shuffled.keys, shuffled, activeLessons).status,
      'correct',
      `${lesson.id} lost its answer when shuffled`,
    );
    assert.ok(
      shuffled.choices.some((choice) => choice.key === shuffled.keys),
      `${lesson.id} answer key is missing from its choices`,
    );
    assert.equal(shuffled.choices.length, lesson.choices.length);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

// Every current lesson has a deliberate lesson-, setting-, or sim-level effect;
// fallback exists only so a future lesson degrades safely while its visual is
// being authored.
const bufferLessons = activeLessons.filter(
  (lesson) => lesson.kind === 'keymap' && lesson.sim === 'buffer',
);
assert.equal(bufferLessons.length, 48, 'the buffer-effect coverage baseline changed');
const explicitIds = new Set(explicitEffectIds);

for (const lesson of activeLessons) {
  const resolved = resolveLessonEffect(lesson);
  assert.notEqual(resolved.source, 'fallback', `${lesson.id} has no intentional visual effect`);

  const before = deepFreeze(createEditorState(lesson));
  const first = resolved.effect(before);
  const second = applyLessonEffect(before, lesson);
  assert.deepEqual(first, second, `${lesson.id} effect is not deterministic`);
  assert.deepEqual(
    validateEditorState(first),
    [],
    `${lesson.id} produced an invalid editor state`,
  );

  if (lesson.kind === 'keymap' && lesson.sim === 'buffer') {
    assert.ok(explicitIds.has(lesson.id), `${lesson.id} lacks an explicit buffer effect`);
    assert.notDeepEqual(first, before, `${lesson.id} visual effect changes nothing`);
  }
}

// Regression guards for four simulator defects found while adding playback.
const backdropSettings = activeLessons.filter(
  (lesson) => lesson.kind === 'setting' && lesson.sim !== 'settings',
);
assert.equal(backdropSettings.length, 19, 'setting-backdrop coverage changed');
for (const lesson of backdropSettings) {
  const after = applyLessonEffect(createEditorState(lesson), lesson);
  assert.equal(after.activePane, lesson.sim, `${lesson.id} lost its backdrop pane`);
}

const commandLesson = activeLessons.find((lesson) => lesson.id === 'modes.command');
const commandState = applyLessonEffect(createEditorState(commandLesson), commandLesson);
assert.equal(commandState.mode, 'COMMAND');
assert.equal(commandState.commandLine, ':');

const deleteBuffer = activeLessons.find((lesson) => lesson.id === 'core.delete_buffer');
const nextBuffer = activeLessons.find((lesson) => lesson.id === 'core.next_buffer');
const deleteBefore = createEditorState(deleteBuffer);
const deleteAfter = applyLessonEffect(deleteBefore, deleteBuffer);
const nextAfter = applyLessonEffect(createEditorState(nextBuffer), nextBuffer);
assert.equal(deleteAfter.tabs.length, deleteBefore.tabs.length - 1, 'delete buffer only switched tabs');
assert.equal(nextAfter.tabs.length, deleteBefore.tabs.length, 'next buffer unexpectedly closed a tab');
assert.notEqual(deleteAfter.file.path, deleteBefore.file.path, 'statusline file did not follow active tab');
assert.ok(
  Number.isInteger(deleteAfter.cursor.line) && Number.isInteger(deleteAfter.cursor.col),
  'statusline cursor position has no editor-state source',
);

// Visual setting descriptors must refer to real curriculum values, otherwise a
// rename silently turns a comparison back into a text-only explanation.
const curriculumSettingNames = new Set(
  activeLessons.filter((lesson) => lesson.kind === 'setting').map((lesson) => lesson.setting),
);
assert.ok(Object.keys(VISUAL_SETTINGS).length >= 60, 'visual setting coverage regressed');
for (const setting of Object.keys(VISUAL_SETTINGS)) {
  assert.ok(curriculumSettingNames.has(setting), `visual setting "${setting}" is not in the curriculum`);
}

// Scheduling: every lesson must be reachable, which is what made topic mastery
// impossible before. Salesforce alone used to cap at 41% because Learn mode only
// ever served the first 12 lessons of a selection.
{
  const pool = lessonsForTopics(['salesforce']);
  assert.ok(pool.length > 12, 'this guard is meaningless unless the pool exceeds one session');

  let progress = { ...emptyProgress };
  const seen = new Set();
  let sessions = 0;
  while (remainingCount(pool, progress) > 0) {
    sessions += 1;
    assert.ok(sessions < 50, 'scheduler failed to converge on full mastery');
    for (const lesson of selectSession(pool, progress, sessionSizeFor('25', pool, progress))) {
      seen.add(lesson.id);
      progress = recordAnswer(progress, lesson, true);
    }
  }
  assert.equal(seen.size, pool.length, 'some lessons were never served');
  assert.equal(topicTotals(progress, topics, activeLessons).salesforce.percent, 100);
}

// Fresh lessons take priority: nothing repeats while unseen work remains.
{
  const pool = lessonsForTopics(['lsp']);
  let progress = { ...emptyProgress };
  const first = selectSession(pool, progress, 12);
  assert.equal(new Set(first.map((item) => item.id)).size, first.length, 'session repeated a lesson');
  for (const lesson of first) progress = recordAnswer(progress, lesson, true);

  const second = selectSession(pool, progress, 12);
  const overlap = second.filter((item) => first.some((seen) => seen.id === item.id));
  assert.equal(overlap.length, 0, 'a seen lesson was served while fresh ones remained');
}

// Mastery needs two correct answers, and a wrong answer gives it back.
{
  const lesson = activeLessons[0];
  let progress = { ...emptyProgress };
  progress = recordAnswer(progress, lesson, true);
  assert.equal(progress.lessons[lesson.id].mastered, false, 'one correct answer must not master');
  progress = recordAnswer(progress, lesson, true);
  assert.equal(progress.lessons[lesson.id].mastered, true, 'two correct answers must master');
  progress = recordAnswer(progress, lesson, false);
  assert.equal(progress.lessons[lesson.id].mastered, false, 'a wrong answer must un-master');
  assert.equal(progress.lessons[lesson.id].correctStreak, 0);
}

// Review order is oldest-solve-first once everything is mastered.
{
  const pool = lessonsForTopics(['modes']);
  let progress = { ...emptyProgress };
  let clock = 1000;
  for (const lesson of pool) {
    progress = recordAnswer(progress, lesson, true, clock += 1000);
    progress = recordAnswer(progress, lesson, true, clock += 1000);
  }
  assert.equal(unmasteredLessons(pool, progress).length, 0, 'everything should be mastered here');
  const review = selectSession(pool, progress, 1);
  assert.equal(review[0].id, pool[0].id, 'review must start with the earliest solve');
}

console.log(
  `nvim-game smoke passed: ${curriculumStats.total} active lessons, `
    + `${curriculumStats.keymaps} keymaps, ${curriculumStats.settings} settings, `
    + `${curriculumStats.topics} topics.`,
);
