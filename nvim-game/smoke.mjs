import assert from 'node:assert/strict';
import {
  activeLessons,
  allLessons,
  curriculumStats,
  lessonsForTopics,
} from './src/data/curriculum/index.js';
import { evaluateSequence } from './src/lib/gameEngine.js';
import { canonicalizeNotation, tokenizeNotation } from './src/lib/keyNotation.js';

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

assert.equal(canonicalizeNotation('<S-h>'), 'H');
assert.deepEqual(tokenizeNotation('<leader>sf'), ['<leader>', 's', 'f']);
assert.ok(lessonsForTopics(['salesforce']).length >= 25);

console.log(
  `nvim-game smoke passed: ${curriculumStats.total} active lessons, `
    + `${curriculumStats.keymaps} keymaps, ${curriculumStats.settings} settings.`,
);
