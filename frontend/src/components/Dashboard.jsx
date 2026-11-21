function Dashboard({ stats }) {
  const cards = [
    { label: 'Total', value: stats.total, cls: 'total' },
    { label: 'Todo', value: stats.todo, cls: 'todo' },
    { label: 'In Progress', value: stats.inProgress, cls: 'inprogress' },
    { label: 'Done', value: stats.done, cls: 'done' },
  ];

  return (
    <div className="dashboard">
      {cards.map((card) => (
        <div key={card.label} className={`stat-card ${card.cls}`}>
          <span className="stat-card__label">{card.label}</span>
          <span className="stat-card__value">{card.value}</span>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
