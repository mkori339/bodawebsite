export default function SectionCard({ title, description, className = '', children, actions }) {
  return (
    <section className={`glass-card ${className}`.trim()}>
      {(title || description || actions) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
