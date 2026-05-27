import { useState } from 'react'
import StatusDropdown from './StatusDropdown'
import TaskForm from './TaskForm'
import Modal from './Modal'
import styles from './TaskCard.module.css'

const PRIORITY_COLORS = { low: '#43aa8b', medium: '#f59e0b', high: '#e05252' }
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' }

export default function TaskCard({ task, onStatusChange, onDelete, onEdit, categories, addCategory }) {
  const [editOpen, setEditOpen] = useState(false)
  const isInactive = task.status === 'realizado' || task.status === 'cancelado'

  function handleEditSubmit(data) {
    onEdit(task.id, data)
    setEditOpen(false)
  }

  const lastChange = task.history?.length > 0
    ? new Date(task.history[task.history.length - 1].timestamp)
    : null

  const timeStr = lastChange
    ? lastChange.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      <div className={`${styles.card} ${isInactive ? styles.inactive : ''}`}>
        <div className={styles.topRow}>
          <span className={styles.title} onClick={() => setEditOpen(true)}>{task.title}</span>
          <span
            className={styles.priority}
            style={{ background: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority] }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          <button className={styles.delete} onClick={() => onDelete(task.id)}>×</button>
        </div>

        {task.description && (
          <p className={styles.desc} onClick={() => setEditOpen(true)}>{task.description}</p>
        )}

        <div className={styles.divider} />

        <div className={styles.metaRow}>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Estado</span>
            <StatusDropdown task={task} onStatusChange={onStatusChange} />
          </div>

          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Categoría</span>
            <span className={styles.metaVal}>{task.category || '—'}</span>
          </div>

          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Última actualización</span>
            <span className={styles.metaVal}>{timeStr || '—'}</span>
          </div>

          {task.endDate && task.endDate !== task.startDate && (
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>Deadline</span>
              <span className={`${styles.metaVal} ${styles.deadline}`}>{task.endDate}</span>
            </div>
          )}

          {task.status === 'reprogramado' && task.rescheduledTo && (
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>Reprog.</span>
              <span className={`${styles.metaVal} ${styles.reschedule}`}>{task.rescheduledTo}</span>
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <Modal title="Editar tarea" onClose={() => setEditOpen(false)}>
          <TaskForm
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
            initialData={task}
            categories={categories}
            addCategory={addCategory}
          />
        </Modal>
      )}
    </>
  )
}
