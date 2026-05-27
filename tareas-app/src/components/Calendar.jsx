import { useState, useRef, useEffect } from 'react'
import { getDaysInMonth, getFirstDayOfMonth, toDateStr, todayStr, formatDate } from '../utils/dates'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import Modal from './Modal'
import styles from './Calendar.module.css'

const MONTH_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS        = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const YEARS       = Array.from({ length: 35 }, (_, i) => 2026 + i)

const STATUS_ORDER_LIST = ['en-curso', 'pendiente', 'en-revision', 'reprogramado', 'realizado', 'cancelado']
const PRIORITY_ORDER    = { high: 3, medium: 2, low: 1 }

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
        return mult * (STATUS_ORDER_LIST.indexOf(a.status) - STATUS_ORDER_LIST.indexOf(b.status))
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

function MonthYearPicker({ year, month, onChange, onClose }) {
  const [pickerYear, setPickerYear] = useState(year)
  const [showYearDrop, setShowYearDrop] = useState(false)
  const ref = useRef()
  const yearListRef = useRef()

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    if (showYearDrop && yearListRef.current) {
      const active = yearListRef.current.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  }, [showYearDrop])

  return (
    <div className={styles.picker} ref={ref}>
      <div className={styles.pickerYearRow}>
        <button
          className={styles.pickerYearBtn}
          onClick={() => setPickerYear(y => Math.max(YEARS[0], y - 1))}
          disabled={pickerYear <= YEARS[0]}
        >‹</button>

        <div className={styles.yearDropWrap}>
          <button
            className={styles.yearDropTrigger}
            onClick={() => setShowYearDrop(v => !v)}
          >
            {pickerYear} <span className={styles.yearCaret}>{showYearDrop ? '▲' : '▼'}</span>
          </button>
          {showYearDrop && (
            <div className={styles.yearDropList} ref={yearListRef}>
              {YEARS.map(y => (
                <button
                  key={y}
                  data-active={y === pickerYear}
                  className={`${styles.yearDropItem} ${y === pickerYear ? styles.yearDropActive : ''}`}
                  onClick={() => { setPickerYear(y); setShowYearDrop(false) }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={styles.pickerYearBtn}
          onClick={() => setPickerYear(y => Math.min(YEARS[YEARS.length - 1], y + 1))}
          disabled={pickerYear >= YEARS[YEARS.length - 1]}
        >›</button>
      </div>

      <div className={styles.pickerMonths}>
        {MONTH_SHORT.map((m, i) => (
          <button
            key={i}
            className={`${styles.pickerMonth} ${pickerYear === year && i === month ? styles.pickerMonthActive : ''}`}
            onClick={() => { onChange(pickerYear, i); onClose() }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Calendar({ tasks, addTask, updateTask, deleteTask, changeStatus, categories, addCategory, onGoHome }) {
  const today = todayStr()
  const [viewDate,    setViewDate]    = useState(new Date())
  const [selected,    setSelected]    = useState(today)
  const [showForm,    setShowForm]    = useState(false)
  const [showPicker,  setShowPicker]  = useState(false)
  const [sortField,   setSortField]   = useState('priority')
  const [sortDir,     setSortDir]     = useState('desc')

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  function getTasksForDate(dateStr) {
    return tasks.filter(t => {
      const start = t.startDate || t.date
      const end   = t.endDate
      return end ? start <= dateStr && end >= dateStr : start === dateStr
    })
  }

  const selectedTasks     = getTasksForDate(selected)
  const selectedActive    = selectedTasks.filter(t => !['realizado','cancelado'].includes(t.status))
  const selectedDone      = selectedTasks.filter(t => t.status === 'realizado')
  const selectedCancelled = selectedTasks.filter(t => t.status === 'cancelado')

  const sortedActive    = sortTasks(selectedActive,    sortField, sortDir)
  const sortedDone      = sortTasks(selectedDone,      sortField, sortDir)
  const sortedCancelled = sortTasks(selectedCancelled, sortField, sortDir)

  const cells = []
  for (let i = 0; i < getFirstDayOfMonth(year, month); i++) cells.push(null)
  for (let d = 1; d <= getDaysInMonth(year, month); d++) cells.push(d)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onGoHome}>← Inicio</button>

        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>

          <div className={styles.monthTitleWrap}>
            <button className={styles.monthTitleBtn} onClick={() => setShowPicker(v => !v)}>
              {MONTH_FULL[month]} {year}
              <span className={styles.monthCaret}>▾</span>
            </button>
            {showPicker && (
              <MonthYearPicker
                year={year}
                month={month}
                onChange={(y, m) => setViewDate(new Date(y, m, 1))}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          <button className={styles.navBtn} onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
        </div>

        <div style={{ width: 80 }} />
      </div>

      <div className={styles.calBody}>
        {/* ── Columna izquierda: calendario ── */}
        <div className={styles.calLeft}>
          <div className={styles.grid}>
            {DAYS.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dateStr  = toDateStr(new Date(year, month, day))
              const dayTasks = getTasksForDate(dateStr)
              const isToday    = dateStr === today
              const isSelected = dateStr === selected
              return (
                <button
                  key={dateStr}
                  className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelected(dateStr)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {dayTasks.length > 0 && (
                    <div className={styles.dots}>
                      {dayTasks.slice(0, 3).map(t => (
                        <span key={t.id} className={styles.dot}
                          style={{ background: ['realizado','cancelado'].includes(t.status) ? 'var(--c300)' : 'var(--c700)' }} />
                      ))}
                      {dayTasks.length > 3 && <span className={styles.dotMore}>+{dayTasks.length-3}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Columna derecha: panel de tareas ── */}
        <div className={styles.calRight}>
          <div className={styles.dayPanel}>
            <div className={styles.dayPanelHeader}>
              <div>
                <h3 className={styles.dayPanelTitle}>{formatDate(selected)}</h3>
                <p className={styles.dayPanelSub}>
                  {selectedTasks.length === 0 ? 'Sin tareas' : `${selectedDone.length} de ${selectedTasks.length} realizadas`}
                </p>
              </div>
              <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ Tarea</button>
            </div>

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

            {selectedTasks.length === 0 ? (
              <div className={styles.empty}>
                <p>No hay tareas para este día.</p>
                <button className={styles.emptyBtn} onClick={() => setShowForm(true)}>Añadir tarea</button>
              </div>
            ) : (
              <div className={styles.taskList}>
                {[...sortedActive, ...sortedDone, ...sortedCancelled].map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={changeStatus} onDelete={deleteTask}
                    onEdit={(id, data) => updateTask(id, data)} categories={categories} addCategory={addCategory} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <Modal title="Nueva tarea" onClose={() => setShowForm(false)}>
          <TaskForm
            onSubmit={d => { addTask({ ...d, startDate: d.startDate || selected }); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
            initialDate={selected}
            categories={categories}
            addCategory={addCategory}
          />
        </Modal>
      )}
    </div>
  )
}
