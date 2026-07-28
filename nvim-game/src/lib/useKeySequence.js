import { useCallback, useEffect, useRef, useState } from 'react';
import { eventToNotation } from './keyNotation.js';

export function useKeySequence({
  enabled = true,
  timeoutMs = 300,
  onInput,
  onTimeout,
}) {
  const [sequence, setSequence] = useState('');
  const timerRef = useRef(null);
  const sequenceRef = useRef('');
  const onInputRef = useRef(onInput);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onInputRef.current = onInput;
    onTimeoutRef.current = onTimeout;
  }, [onInput, onTimeout]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    sequenceRef.current = '';
    setSequence('');
  }, [clearTimer]);

  const scheduleTimeout = useCallback(
    (next) => {
      clearTimer();
      const delay = typeof timeoutMs === 'function' ? timeoutMs(next) : timeoutMs;
      if (delay == null || !Number.isFinite(delay)) {
        return;
      }
      timerRef.current = window.setTimeout(() => {
        onTimeoutRef.current?.(next);
        sequenceRef.current = '';
        setSequence('');
      }, delay);
    },
    [clearTimer, timeoutMs],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled || event.repeat) {
        return;
      }

      const notation = eventToNotation(event);
      if (!notation) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Escape abandons a sticky leader chord, which never times out on its
      // own. Other buffers expire normally, so Escape stays a real key there
      // and sequences such as <Esc><Esc> remain typable.
      if (notation === '<Esc>' && sequenceRef.current.startsWith('<leader>')) {
        reset();
        return;
      }

      const next = sequenceRef.current + notation;
      sequenceRef.current = next;
      setSequence(next);
      scheduleTimeout(next);
      onInputRef.current?.(next, notation);
    },
    [enabled, reset, scheduleTimeout],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return {
    sequence,
    handleKeyDown,
    reset,
  };
}
