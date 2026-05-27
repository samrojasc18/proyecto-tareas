import { useState, useRef, useEffect } from 'react'
import { STATUS_LIST, STATUSES } from '../utils/statuses'
import styles from './StatusDropdown.module.css'

export default function StatusDropdown({ task, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('list')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function close() {
    setOpen(false)
    setStep('list')
    setRescheduleDate('')
    setCancelReason('')
  }

  function selectStatus(value) {
    if (value === 'reprogramado') { setStep('reschedule'); return }
    if (value === 'cancelado') { setStep('cancel'); return }
    onStatusChange(task.id, value, {})
    close()
  }

  function confirmReschedule() {
    if (!rescheduleDate) return
    onStatusChange(task.id, 'reprogramado', { rescheduledTo: rescheduleDate, note: `Reprogramado al ${rescheduleDate}` })
    close()
  }

  function confirmCancel() {
    if (!cancelReason.trim()) return
    onStatusChange(task.id, 'cancelado', { cancelReason: cancelReason.trim(), note: `Cancelado: ${cancelReason.trim()}` })
    close()
  }

  const s = STATUSES[task.status] || STATUSES['pendiente']

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        style={{ background: s.bg, color: s.textColor, borderColor: s.color + '66' }}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); setStep('list') }}
      >
        <span className={styles.dot} style={{ background: s.color }} />
        {s.label}
        <span className={styles.caret}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
          {step === 'list' && STATUS_LIST.filter(o => o.value !== task.status).map(opt => (
            <button key={opt.value} type="button" className={styles.option} onClick={() => selectStatus(opt.value)}>
              <span className={styles.optDot} style={{ background: opt.color }} />
              <span>{opt.label}</span>
            </button>
          ))}

          {step === 'reschedule' && (
            <div className={styles.extra}>
              <p className={styles.extraLabel}>Reprogramar para</p>
              <input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className={styles.input}
                autoFocus
              />
              <div className={styles.extraRow}>
                <button type="button" className={styles.btnBack} onClick={() => setStep('list')}>← Atrás</button>
                <button type="button" className={styles.btnOk} disabled={!rescheduleDate} onClick={confirmReschedule}>OK</button>
              </div>
            </div>
          )}

          {step === 'cancel' && (
            <div className={styles.extra}>
              <p className={styles.extraLabel}>Motivo de cancelación</p>
              <input
                type="text"
                placeholder="¿Por qué se cancela?"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className={styles.input}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmCancel()}
              />
              <div className={styles.extraRow}>
                <button type="button" className={styles.btnBack} onClick={() => setStep('list')}>← Atrás</button>
                <button type="button" className={styles.btnOk} disabled={!cancelReason.trim()} onClick={confirmCancel}>OK</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
