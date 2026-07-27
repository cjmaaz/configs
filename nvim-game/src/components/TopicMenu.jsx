export default function TopicMenu({ topics, selected, mastery, onToggle, onSelectAll }) {
  const activeTopics = topics.filter((topic) => !topic.inactive);
  const allActiveSelected = activeTopics.every((topic) => selected.includes(topic.id));

  return (
    <section className="topic-section">
      <div className="topic-title-row">
        <div>
          <p className="eyebrow">Curriculum</p>
          <h2>Choose your arenas</h2>
        </div>
        <button className="button ghost" type="button" onClick={onSelectAll}>
          {allActiveSelected ? 'Deselect all' : 'Select all active'}
        </button>
      </div>
      <div className="topic-grid">
        {topics.map((topic) => {
          const value = mastery[topic.id] || 0;
          const isSelected = selected.includes(topic.id);
          return (
            <button
              className={`topic-card ${isSelected ? 'selected' : ''}`}
              disabled={topic.inactive}
              key={topic.id}
              onClick={() => onToggle(topic.id)}
              type="button"
            >
              <div className="topic-title-row">
                <strong>{topic.name}</strong>
                <span className="pill">{topic.inactive ? 'parked' : `${value}%`}</span>
              </div>
              <p className="muted">{topic.description}</p>
              <div className="mastery-track" aria-label={`${topic.name} mastery ${value}%`}>
                <div className="mastery-fill" style={{ width: `${value}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
