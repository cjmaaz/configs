import { forwardRef } from 'react';
import AnswerReveal from './AnswerReveal.jsx';
import ProgressHud from './ProgressHud.jsx';

const LessonCard = forwardRef(function LessonCard(
  {
    gameMode,
    lesson,
    result,
    pressedLesson,
    alternatives,
    sequence,
    progress,
    index,
    total,
    onNext,
    onSkip,
    onEnter,
    onFocus,
    isFocused,
  },
  ref,
) {
  const answered = result && result.status !== 'pending';

  return (
    <aside
      className={`lesson-panel ${isFocused ? 'is-focused' : ''}`}
      ref={ref}
      tabIndex={0}
      onFocus={onFocus}
      onPointerDown={onFocus}
      onMouseDown={(event) => {
        if (!event.target.closest('button')) {
          event.currentTarget.focus();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          event.preventDefault();
          onEnter();
        }
      }}
      aria-label="Challenge actions; press Enter for the highlighted action"
    >
      <ProgressHud
        xp={progress.xp}
        level={progress.level}
        streak={progress.streak}
        index={index}
        total={total}
      />

      <div className="lesson-meta" style={{ marginTop: 22 }}>
        <span>{lesson.topic}</span>
        <span>{lesson.mode}</span>
      </div>
      <h2 className="lesson-prompt">{lesson.prompt}</h2>

      {gameMode === 'learn' && (
        <div className="key-chord">
          {lesson.kind === 'setting' ? 'Press the option number: ' : ''}
          {lesson.keys}
        </div>
      )}

      {lesson.kind === 'setting' && (
        <div className="answer-reveal">
          {lesson.choices.map((choice) => (
            <div className="answer-row" key={choice.key}>
              <kbd>{choice.key}</kbd> {choice.label}
              {gameMode === 'learn' && <div className="muted">{choice.effect}</div>}
            </div>
          ))}
        </div>
      )}

      <div
        className={`capture-state ${
          result?.status === 'correct' ? 'success' : result?.status === 'wrong' ? 'error' : ''
        }`}
      >
        {answered
          ? result.status === 'correct'
            ? 'Command accepted. Watch the simulator respond.'
            : 'Answer captured. Review the mapping and nearby alternatives.'
          : sequence
            ? `Keys: ${sequence}`
            : 'Focus the terminal pane and type your answer.'}
      </div>

      <AnswerReveal
        lesson={lesson}
        result={result}
        pressedLesson={pressedLesson}
        alternatives={alternatives}
      />

      <div className="lesson-actions">
        {answered ? (
          <button className="button primary keyboard-default" type="button" onClick={onNext}>
            Next challenge
          </button>
        ) : (
          <button className="button ghost keyboard-default" type="button" onClick={onSkip}>
            Skip for now
          </button>
        )}
        <span className="enter-hint">↵ Enter</span>
      </div>
    </aside>
  );
});

export default LessonCard;
