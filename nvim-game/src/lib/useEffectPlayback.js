import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyLessonEffect } from './effects.js';
import { createEditorState } from './editorState.js';

const PREVIEW_DELAY = 320;
const PLAY_DELAY = 120;
const EFFECT_HOLD = 1000;
const LOOP_GAP = 1000;
const REPLAY_COUNT = 3;

function stamp(state, revision) {
  return { ...state, revision };
}

export function useEffectPlayback({ lesson, gameMode, result }) {
  const before = useMemo(() => createEditorState(lesson), [lesson]);
  const after = useMemo(() => applyLessonEffect(before, lesson), [before, lesson]);
  const [state, setState] = useState(before);
  const [phase, setPhase] = useState('before');
  const [iteration, setIteration] = useState(0);
  const timersRef = useRef([]);
  const revisionRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const show = useCallback((nextState, nextPhase, nextIteration = 0) => {
    revisionRef.current += 1;
    setState(stamp(nextState, revisionRef.current));
    setPhase(nextPhase);
    setIteration(nextIteration);
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  }, []);

  const play = useCallback(
    ({ hold = true, preview = false, initialDelay = PLAY_DELAY } = {}) => {
      clearTimers();
      show(before, preview ? 'preview-before' : 'playing');

      for (let index = 0; index < REPLAY_COUNT; index += 1) {
        const iterationNumber = index + 1;
        const afterAt = initialDelay + index * (EFFECT_HOLD + LOOP_GAP);
        const lastIteration = iterationNumber === REPLAY_COUNT;
        schedule(() => {
          show(
            after,
            preview ? 'preview' : lastIteration && hold ? 'settled' : 'playing',
            iterationNumber,
          );
        }, afterAt);

        if (!lastIteration) {
          schedule(() => {
            show(
              before,
              preview ? 'preview-gap' : 'playing-gap',
              iterationNumber,
            );
          }, afterAt + EFFECT_HOLD);
        }
      }

      if (!hold) {
        const finalAfterAt =
          initialDelay + (REPLAY_COUNT - 1) * (EFFECT_HOLD + LOOP_GAP);
        schedule(() => {
          show(before, 'ready');
        }, finalAfterAt + EFFECT_HOLD);
      }
    },
    [after, before, clearTimers, schedule, show],
  );

  // Learn mode demonstrates the expected action three times, with one second in
  // the before-state between repetitions, then rewinds to the state the learner
  // will act on. Practice stays still until an answer lands.
  useEffect(() => {
    clearTimers();
    if (gameMode === 'learn') {
      play({ hold: false, preview: true, initialDelay: PREVIEW_DELAY });
    } else {
      show(before, 'ready');
    }

    return clearTimers;
  }, [before, clearTimers, gameMode, play, show]);

  // Practice demonstrates the correct action even after a wrong answer; that is
  // the teaching moment. Learn mode only reaches this branch on a correct answer
  // because wrong input keeps the challenge active.
  useEffect(() => {
    if (!result || result.status === 'pending') return;
    play({ hold: true });
  }, [play, result]);

  const replay = useCallback(() => {
    const answered = result && result.status !== 'pending';
    play({ hold: Boolean(answered), preview: !answered });
  }, [play, result]);

  return {
    state,
    phase,
    iteration,
    replayCount: REPLAY_COUNT,
    replay,
    isEffectVisible: phase === 'preview' || phase === 'playing' || phase === 'settled',
  };
}
