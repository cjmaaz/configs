export default function NetrwPane() {
  return (
    <aside className="netrw-pane" aria-label="Netrw tree simulation">
      <div className="muted">netrw tree · 25%</div>
      <div className="tree-row">../</div>
      <div className="tree-row">▾ nvim/</div>
      <div className="tree-row">│ ▾ lua/</div>
      <div className="tree-row">│ │ ▸ core/</div>
      <div className="tree-row selected">│ │ ▸ plugins/</div>
      <div className="tree-row">│ ├ init.lua</div>
      <div className="tree-row">│ └ lazy-lock.json</div>
      <div className="tree-row">▸ nvim-game/</div>
      <div className="tree-row">  README.md</div>
    </aside>
  );
}
