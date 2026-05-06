import { humanizeStatus } from '../services/formatters.js';

export default function StatusBadge({ value }) {
  return (
    <span className={`status-badge status-${value}`}>
      {humanizeStatus(value)}
    </span>
  );
}
