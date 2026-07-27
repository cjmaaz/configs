export function keyLesson({
  id,
  topic,
  keys,
  mode = 'NORMAL',
  label,
  prompt,
  explains,
  siblings = [],
  sim = 'buffer',
  inactive = false,
}) {
  return {
    id,
    topic,
    kind: 'keymap',
    keys,
    mode,
    label,
    prompt,
    explains,
    siblings,
    sim,
    inactive,
  };
}

export function settingLesson({
  id,
  topic,
  setting,
  value,
  label,
  prompt,
  explains,
  choices,
  sim = 'settings',
}) {
  const correct = choices.findIndex((choice) => choice.value === value);
  if (correct === -1) {
    throw new Error(`Setting lesson ${id} has no choice for ${String(value)}`);
  }

  return {
    id,
    topic,
    kind: 'setting',
    keys: String(correct + 1),
    mode: 'NORMAL',
    setting,
    value,
    label,
    prompt,
    explains,
    choices: choices.map((choice, index) => ({
      ...choice,
      key: String(index + 1),
    })),
    siblings: choices
      .filter((_, index) => index !== correct)
      .map((choice, index) => String(index + 1 + (index >= correct ? 1 : 0))),
    sim,
  };
}
