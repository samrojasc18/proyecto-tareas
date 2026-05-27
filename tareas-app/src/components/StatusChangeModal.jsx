import { useState } from 'react'
import Modal from './Modal'
import { STATUS_LIST, STATUSES } from '../utils/statuses'
import styles from './StatusChangeModal.module.css'

export default function StatusChangeModal({ task, onConfirm, onClose }) {
  const [selected, setSelected] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const needsDate = selected === 'reprogramado'
  const needsReason = selected === 'cancelado'
  const canConfirm = selected &&
    (!needsDate || rescheduleDate) &&
    (!needsReason || cancelReason.trim())

  function handleConfirm() {
    if (!canConfirm) return
    const metadata = {}
    if (needsDate) {
      metadata.rescheduledTo = rescheduleDate
      metadata.note = `Reprogramado al ${rescheduleDate}`
    }
    if (needsReason) {
      metadata.cancelReason = cancelReason.trim()
      metadata.note = `Cancelado: ${cancelReason.trim()}`
    }
    onConfirm(selected, metadata)
  }

  return (
    <Modal title="Cambiar estado" onClose={onClose}>
      <div className={styles.container}>
        <p className={styles.taskName}>{task.title}</p>

        <div className={styles.current}>
          <span>Estado actual:</span>
          <span className={styles.currentBadge}
            style={{ background: STATUSES[task.status]?.bg, color: STATUSES[task.status]?.textColor }}>
            {STATUSES[task.status]?.label}
          </span>
        </div>

        <div className={styles.options}>
          {STATUS_LIST.filter(s => s.value !== task.status).map(s => (
            <button
              key={s.value}
              type="button"
              className={`${styles.option} ${selected === s.value ? styles.optionSelected : ''}`}
              style={selected === s.value
                ? { borderColor: s.color, background: s.bg, color: s.textColor }
                : {}}
              onClick={() => setSelected(s.value)}
            >
              <span className={styles.dot} style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>

        {needsDate && (
          <div className={styles.extra}>
            <label>Reprogramar para el día</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={e => setRescheduleDate(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {needsReason && (
          <div className={styles.extra}>
            <label>Motivo de cancelación</label>
            <textarea
              placeholder="¿Por qué se cancela esta tarea?"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              autoFocus
            />
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={onClose}>Cancelar</button>
          <button
            className={styles.confirm}
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  )
}
