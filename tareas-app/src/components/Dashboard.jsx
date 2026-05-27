import { useState } from 'react'
import { todayStr, formatDate, getGreeting } from '../utils/dates'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import Modal from './Modal'
import styles from './Dashboard.module.css'

const STATUS_ORDER = ['en-curso', 'pendiente', 'en-revision', 'reprogramado', 'realizado', 'cancelado']

export default function Dashboard({ tasks, addTask, updateTask, deleteTask, changeStatus, onGoToCalendar }) {
  const today = todayStr()
  const todayTasks = tasks.filter(t => {
    const start = t.startDate || t.date
    const end = t.endDate
    return end ? start <= today && end >= today : start === today
  })

  const active = todayTasks.filter(t => !['realizado', 'cancelado'].includes(t.status))
  const done = todayTasks.filter(t => t.status === 'realizado')
  const cancelled = todayTasks.filter(t => t.status === 'cancelado')
  const sortedActive = [...active].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

  const [showForm, setShowForm] = useState(false)
  const progress = todayTasks.length > 0 ? Math.round((done.length / todayTasks.length) * 100) : 0

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.date}>{formatDate(today)}</h1>
          {todayTasks.length > 0 ? (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressText}>{done.length} de {todayTasks.length} realizadas</span>
            </div>
          ) : (
            <p className={styles.subtitle}>No tienes tareas para hoy. ¿Empezamos?</p>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {todayTasks.length === 0 && (
          <div className={styles.startCard}>
            <div className={styles.startIcon}>☀️</div>
            <h2 className={styles.startTitle}>Empieza tu día</h2>
            <p className={styles.startDesc}>Añade las tareas que quieres completar hoy.</p>
            <button className={styles.startBtn} onClick={() => setShowForm(true)}>+ Añadir primera tarea</button>
          </div>
        )}

        {sortedActive.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>En progreso</h3>
              <span className={styles.badge}>{sortedActive.length}</span>
            </div>
            <div className={styles.list}>
              {sortedActive.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                  onEdit={(id, data) => updateTask(id, data)} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Realizadas</h3>
              <span className={`${styles.badge} ${styles.badgeDone}`}>{done.length}</span>
            </div>
            <div className={styles.list}>
              {done.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                  onEdit={(id, data) => updateTask(id, data)} />
              ))}
            </div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Canceladas</h3>
              <span className={`${styles.badge} ${styles.badgeCancelled}`}>{cancelled.length}</span>
            </div>
            <div className={styles.list}>
              {cancelled.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                  onEdit={(id, data) => updateTask(id, data)} />
              ))}
            </div>
          </section>
        )}

        {todayTasks.length > 0 && (
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ Añadir tarea</button>
        )}

        <div className={styles.calendarLink}>
          <button onClick={onGoToCalendar} className={styles.linkBtn}>Ver calendario completo →</button>
        </div>
      </div>

      {showForm && (
        <Modal title="Nueva tarea" onClose={() => setShowForm(false)}>
          <TaskForm onSubmit={d => { addTask(d); setShowForm(false) }} onCancel={() => setShowForm(false)} initialDate={today} />
        </Modal>
      )}
    </div>
  )
}
