export default function ProgressHud({ xp, level, streak, index, total }) {
  return (
    <>
      <div className="progress-hud">
        <span>Level {level}</span>
        <span>{xp} XP</span>
        <span>{streak > 1 ? `${streak}× streak` : 'build a streak'}</span>
        <span>
          {Math.min(index + 1, total)} / {total}
        </span>
      </div>
      <div className="session-progress" aria-label="Session progress">
        <div
          className="session-progress-fill"
          style={{ width: `${total ? (index / total) * 100 : 0}%` }}
        />
      </div>
    </>
  );
}
