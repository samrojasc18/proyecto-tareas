import { useState } from 'react'
import { todayStr, formatDate, getGreeting } from '../utils/dates'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import Modal from './Modal'
import styles from './Dashboard.module.css'

const STATUS_ORDER  = ['en-curso', 'pendiente', 'en-revision', 'reprogramado', 'realizado', 'cancelado']
const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 }

const SORT_OPTIONS = [
  { value: 'priority', label: 'Prioridad'     },
  { value: 'status',   label: 'Estado'        },
  { value: 'title',    label: 'Nombre'        },
  { value: 'updated',  label: 'Actualización' },
]

function sortTasks(tasks, field, dir) {
  const mult = dir === 'asc' ? 1 : -1
  return [...tasks].sort((a, b) => {
    switch (field) {
      case 'priority':
        return mult * ((PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0))
      case 'status':
        return mult * (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
      case 'title':
        return mult * (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
      case 'updated': {
        const at = a.history?.length ? new Date(a.history[a.history.length - 1].timestamp) : new Date(a.createdAt || 0)
        const bt = b.history?.length ? new Date(b.history[b.history.length - 1].timestamp) : new Date(b.createdAt || 0)
        return mult * (at - bt)
      }
      default: return 0
    }
  })
}

export default function Dashboard({ tasks, addTask, updateTask, deleteTask, changeStatus, categories, addCategory, onGoToCalendar }) {
  const today = todayStr()
  const todayTasks = tasks.filter(t => {
    const start = t.startDate || t.date
    const end = t.endDate
    return end ? start <= today && end >= today : start === today
  })

  const active    = todayTasks.filter(t => !['realizado', 'cancelado'].includes(t.status))
  const done      = todayTasks.filter(t => t.status === 'realizado')
  const cancelled = todayTasks.filter(t => t.status === 'cancelado')

  const [showForm,  setShowForm]  = useState(false)
  const [sortField, setSortField] = useState('priority')
  const [sortDir,   setSortDir]   = useState('desc')

  const sortedActive    = sortTasks(active,    sortField, sortDir)
  const sortedDone      = sortTasks(done,      sortField, sortDir)
  const sortedCancelled = sortTasks(cancelled, sortField, sortDir)

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

        {/* ── Barra de orden ── */}
        {todayTasks.length > 0 && (
          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Ordenar por</span>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className={styles.sortSelect}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              className={`${styles.dirBtn} ${sortDir === 'asc' ? styles.dirBtnAsc : ''}`}
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            >
              {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
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
                  onEdit={(id, data) => updateTask(id, data)} categories={categories} addCategory={addCategory} />
              ))}
            </div>
          </section>
        )}

        {sortedDone.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Realizadas</h3>
              <span className={`${styles.badge} ${styles.badgeDone}`}>{sortedDone.length}</span>
            </div>
            <div className={styles.list}>
              {sortedDone.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                  onEdit={(id, data) => updateTask(id, data)} categories={categories} addCategory={addCategory} />
              ))}
            </div>
          </section>
        )}

        {sortedCancelled.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Canceladas</h3>
              <span className={`${styles.badge} ${styles.badgeCancelled}`}>{sortedCancelled.length}</span>
            </div>
            <div className={styles.list}>
              {sortedCancelled.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                  onEdit={(id, data) => updateTask(id, data)} categories={categories} addCategory={addCategory} />
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
          <TaskForm
            onSubmit={d => { addTask(d); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
            initialDate={today}
            categories={categories}
            addCategory={addCategory}
          />
        </Modal>
      )}
    </div>
  )
}
