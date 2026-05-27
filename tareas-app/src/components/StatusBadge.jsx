import { STATUSES } from '../utils/statuses'
import styles from './StatusBadge.module.css'

export default function StatusBadge({ status, onClick, size = 'md' }) {
  const s = STATUSES[status] || STATUSES['pendiente']
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      className={`${styles.badge} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      style={{ background: s.bg, color: s.textColor, borderColor: s.color + '55' }}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      title={onClick ? 'Cambiar estado' : undefined}
    >
      <span className={styles.dot} style={{ background: s.color }} />
      {s.label}
    </Tag>
  )
}
