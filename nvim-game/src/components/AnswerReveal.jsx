export default function AnswerReveal({ lesson, result, pressedLesson, alternatives }) {
  if (!result || result.status === 'pending') return null;

  return (
    <div className="answer-reveal">
      <div className="answer-row">
        <strong>{result.status === 'correct' ? 'Correct.' : 'Not quite.'}</strong>{' '}
        You pressed <kbd>{result.rawInput || 'nothing'}</kbd>.
      </div>
      {result.status === 'wrong' && pressedLesson && (
        <div className="answer-row">
          That key means <strong>{pressedLesson.label}</strong>: {pressedLesson.explains}
        </div>
      )}
      <div className="answer-row">
        Correct answer: <kbd>{lesson.keys}</kbd> — <strong>{lesson.label}</strong>.
        {lesson.kind === 'setting' && (
          <>
            {' '}
            This config uses <kbd>{String(lesson.value)}</kbd>.
          </>
        )}
        <div className="muted">{lesson.explains}</div>
      </div>
      {alternatives.length > 0 && (
        <>
          <strong>Nearby alternatives</strong>
          <ul className="alternative-list">
            {alternatives.map((item) => (
              <li key={`${item.keys}-${item.label}`}>
                <kbd>{item.keys}</kbd> {item.label} — {item.explains}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
