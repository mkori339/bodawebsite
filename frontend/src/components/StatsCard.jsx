export default function StatsCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="stats-card">
      <div className="stats-icon">
        <Icon size={20} />
      </div>
      <div>
        <span className="stats-label">{label}</span>
        <strong className="stats-value">{value}</strong>
        {hint ? <small className="stats-hint">{hint}</small> : null}
      </div>
    </article>
  );
}
