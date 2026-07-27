export default function SettingsPane({ lesson }) {
  if (!lesson?.choices) return null;

  return (
    <div className="overlay-pane lsp-popover" aria-label="Setting alternatives">
      <div className="overlay-header">
        <span>:set · {lesson.setting}</span>
        <span className="muted">current: {String(lesson.value)}</span>
      </div>
      <div>
        {lesson.choices.map((choice) => (
          <div className="answer-row" key={choice.key}>
            <kbd>{choice.key}</kbd> {choice.label}
            <div className="muted">{choice.effect}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
