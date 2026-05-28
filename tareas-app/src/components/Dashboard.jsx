import { useState } from 'react'
import { todayStr, formatDate, getGreeting, addDays, matchesDate } from '../utils/dates'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import Modal from './Modal'
import styles from './Dashboard.module.css'

const STATUS_ORDER   = ['en-curso', 'pendiente', 'en-revision', 'reprogramado', 'realizado', 'cancelado']
const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 }

const SORT_OPTIONS = [
  { value: 'status',   label: 'Estado'        },
  { value: 'priority', label: 'Prioridad'     },
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
  const [selectedDate, setSelectedDate] = useState(today)
  const [showForm,  setShowForm]  = useState(false)
  const [sortField, setSortField] = useState('status')
  const [sortDir,   setSortDir]   = useState('asc')

  const isToday       = selectedDate === today
  const selectedTasks = tasks.filter(t => matchesDate(t, selectedDate))
  const active        = selectedTasks.filter(t => !['realizado', 'cancelado'].includes(t.status))
  const done          = selectedTasks.filter(t => t.status === 'realizado')
  const cancelled     = selectedTasks.filter(t => t.status === 'cancelado')

  const sortedActive    = sortTasks(active,    sortField, sortDir)
  const sortedDone      = sortTasks(done,      sortField, sortDir)
  const sortedCancelled = sortTasks(cancelled, sortField, sortDir)

  const progress = selectedTasks.length > 0
    ? Math.round((done.length / selectedTasks.length) * 100)
    : 0

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.greeting}>{getGreeting()}</p>

          {/* ── Navegación de fecha ── */}
          <div className={styles.dateRow}>
            <button className={styles.navArrow} onClick={() => setSelectedDate(d => addDays(d, -1))}>‹</button>
            <div className={styles.dateLabel}>
              <h1 className={styles.date}>{formatDate(selectedDate)}</h1>
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className={styles.dateInput}
                title="Seleccionar fecha"
              />
            </div>
            <button className={styles.navArrow} onClick={() => setSelectedDate(d => addDays(d, 1))}>›</button>
            {!isToday && (
              <button className={styles.todayBtn} onClick={() => setSelectedDate(today)}>Hoy</button>
            )}
          </div>

          {selectedTasks.length > 0 ? (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressText}>{done.length} de {selectedTasks.length} realizadas</span>
            </div>
          ) : (
            <p className={styles.subtitle}>
              {isToday ? 'No tienes tareas para hoy. ¿Empezamos?' : 'No hay tareas para este día.'}
            </p>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {selectedTasks.length === 0 && (
          <div className={styles.startCard}>
            <div className={styles.startIcon}>☀️</div>
            <h2 className={styles.startTitle}>{isToday ? 'Empieza tu día' : 'Sin tareas'}</h2>
            <p className={styles.startDesc}>
              {isToday ? 'Añade las tareas que quieres completar hoy.' : 'Añade una tarea para este día.'}
            </p>
            <button className={styles.startBtn} onClick={() => setShowForm(true)}>+ Añadir tarea</button>
          </div>
        )}

        {/* ── Barra de orden ── */}
        {selectedTasks.length > 0 && (
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

        {selectedTasks.length > 0 && (
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
            initialDate={selectedDate}
            categories={categories}
            addCategory={addCategory}
          />
        </Modal>
      )}
    </div>
  )
}
