import { useCallback } from 'react';

// A draggable divider. `vertical` resizes left/right (reports clientX deltas);
// `horizontal` resizes up/down (reports clientY deltas). The parent clamps and
// applies the delta to a flex-basis / height.
export default function Resizer({ orientation = 'vertical', onDelta }) {
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const axis = orientation === 'vertical' ? 'clientX' : 'clientY';
      let last = e[axis];
      const onMove = (ev) => {
        const cur = ev[axis];
        const d = cur - last;
        if (d !== 0) {
          onDelta(d);
          last = cur;
        }
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [orientation, onDelta],
  );

  return (
    <div
      className={`resizer ${orientation}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation={orientation === 'vertical' ? 'vertical' : 'horizontal'}
    />
  );
}
