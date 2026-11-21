function FilterBar({ filters, onChange }) {
  const set = (key) => (e) => onChange((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-bar__search"
        placeholder="Search tasks…"
        value={filters.search}
        onChange={set('search')}
      />

      <span className="filter-bar__label">Status:</span>
      <select className="filter-bar__select" value={filters.status} onChange={set('status')}>
        <option value="all">All</option>
        <option value="todo">Todo</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <span className="filter-bar__label">Priority:</span>
      <select className="filter-bar__select" value={filters.priority} onChange={set('priority')}>
        <option value="all">All</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}

export default FilterBar;
