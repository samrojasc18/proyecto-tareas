import { useState, useMemo } from 'react'
import { STATUSES, STATUS_LIST, getCategories } from '../utils/statuses'
import StatusBadge from './StatusBadge'
import styles from './Registros.module.css'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtDuration(ms) {
  if (!ms || ms < 0) return '—'
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m`
  return '< 1m'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, mo, d] = iso.slice(0, 10).split('-')
  return `${d}/${mo}/${y}`
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function calcDurations(history) {
  const result = {}
  for (let i = 0; i < history.length; i++) {
    const entry = history[i]
    const next = history[i + 1]
    const ms = (next ? new Date(next.timestamp) : new Date()) - new Date(entry.timestamp)
    const s = entry.toStatus
    result[s] = (result[s] || 0) + ms
  }
  return result
}

function calcTotal(history) {
  if (!history?.length) return 0
  return new Date() - new Date(history[0].timestamp)
}

export default function Registros({ tasks }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const categories = getCategories()

  const years = useMemo(() => {
    const ys = [...new Set(tasks.map(t => (t.startDate || t.date || '').slice(0, 4)).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks
      .filter(t => {
        const date = t.startDate || t.date || ''
        const taskYear = date.slice(0, 4)
        const taskMonth = date.slice(5, 7)
        const q = search.toLowerCase()
        return (
          (filterCat === 'all' || t.category === filterCat) &&
          (filterStatus === 'all' || t.status === filterStatus) &&
          (filterYear === 'all' || taskYear === filterYear) &&
          (filterMonth === 'all' || taskMonth === filterMonth.padStart(2,'0')) &&
          (!q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [tasks, search, filterCat, filterStatus, filterYear, filterMonth])

  const statusCounts = STATUS_LIST.map(s => ({ ...s, count: tasks.filter(t => t.status === s.value).length })).filter(s => s.count > 0)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Registros</h2>
        <p className={styles.sub}>Historial y seguimiento de tiempos por tarea</p>
      </div>

      <div className={styles.summaryRow}>
        {statusCounts.map(s => (
          <div key={s.value} className={styles.chip}
            style={{ background: s.bg, color: s.textColor, borderColor: s.color + '44' }}>
            <span className={styles.chipDot} style={{ background: s.color }} />
            {s.label} <strong>{s.count}</strong>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar tarea, descripción o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className={styles.select}>
          <option value="all">Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={styles.select}>
          <option value="all">Todos los meses</option>
          {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
        </select>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={styles.select}>
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.select}>
          <option value="all">Todos los estados</option>
          {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {(filterCat !== 'all' || filterStatus !== 'all' || filterMonth !== 'all' || filterYear !== 'all' || search) && (
          <button className={styles.clearBtn} onClick={() => { setFilterCat('all'); setFilterStatus('all'); setFilterMonth('all'); setFilterYear('all'); setSearch('') }}>
            Limpiar filtros
          </button>
        )}
      </div>

      <p className={styles.count}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No hay registros que coincidan.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <span className={styles.cTask}>Tarea</span>
            <span className={styles.cCat}>Categoría</span>
            <span className={styles.cStatus}>Estado</span>
            <span className={styles.cDate}>Inicio</span>
            <span className={styles.cDate}>Deadline</span>
            <span className={styles.cTime}>Tiempo total</span>
          </div>

          {filtered.map(task => {
            const history = task.history || []
            const durations = calcDurations(history)
            const totalMs = calcTotal(history)
            const isOpen = expanded === task.id
            const lastEntry = history[history.length - 1]

            return (
              <div key={task.id} className={styles.rowGroup}>
                <div
                  className={`${styles.row} ${isOpen ? styles.rowOpen : ''}`}
                  onClick={() => setExpanded(isOpen ? null : task.id)}
                >
                  <span className={styles.cTask}>
                    <span className={styles.expandIcon}>{isOpen ? '▾' : '▸'}</span>
                    <span className={styles.taskName}>{task.title}</span>
                  </span>
                  <span className={styles.cCat}>
                    {task.category
                      ? <span className={styles.catPill}>{task.category}</span>
                      : <span className={styles.dash}>—</span>}
                  </span>
                  <span className={styles.cStatus}><StatusBadge status={task.status} size="sm" /></span>
                  <span className={`${styles.cDate} ${styles.dateVal}`}>{fmtDate(task.startDate || task.date)}</span>
                  <span className={`${styles.cDate} ${styles.dateVal}`}>{fmtDate(task.endDate)}</span>
                  <span className={`${styles.cTime} ${styles.timeVal}`}>{fmtDuration(totalMs)}</span>
                </div>

                {isOpen && (
                  <div className={styles.detail}>
                    <div className={styles.detailCols}>
                      <div>
                        <h4 className={styles.detailH}>Tiempo por estado</h4>
                        <div className={styles.durList}>
                          {Object.entries(durations).map(([s, ms]) => (
                            <div key={s} className={styles.durRow}>
                              <StatusBadge status={s} size="sm" />
                              <span className={styles.durVal}>{fmtDuration(ms)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className={styles.detailH}>Historial de cambios</h4>
                        <div className={styles.timeline}>
                          {history.map((entry, i) => {
                            const next = history[i + 1]
                            const dur = fmtDuration(next
                              ? new Date(next.timestamp) - new Date(entry.timestamp)
                              : new Date() - new Date(entry.timestamp))
                            const isLast = i === history.length - 1
                            return (
                              <div key={entry.id || i} className={styles.tlItem}>
                                <div className={styles.tlDot} style={{ background: STATUSES[entry.toStatus]?.color || '#9ca3af' }} />
                                {!isLast && <div className={styles.tlLine} />}
                                <div className={styles.tlBody}>
                                  <div className={styles.tlStates}>
                                    {entry.fromStatus && (
                                      <>
                                        <span className={styles.tlBadge} style={{ background: STATUSES[entry.fromStatus]?.bg, color: STATUSES[entry.fromStatus]?.textColor }}>
                                          {STATUSES[entry.fromStatus]?.label}
                                        </span>
                                        <span className={styles.tlArrow}>→</span>
                                      </>
                                    )}
                                    <span className={styles.tlBadge} style={{ background: STATUSES[entry.toStatus]?.bg, color: STATUSES[entry.toStatus]?.textColor }}>
                                      {STATUSES[entry.toStatus]?.label}
                                    </span>
                                  </div>
                                  <div className={styles.tlMeta}>
                                    <span className={styles.tlDate}>{fmtDateTime(entry.timestamp)}</span>
                                    <span className={styles.tlTime}>🕐 {fmtTime(entry.timestamp)}</span>
                                    <span className={styles.tlDur}>{isLast ? `${dur} (activo)` : dur}</span>
                                  </div>
                                  {entry.note && entry.note !== 'Tarea creada' && (
                                    <p className={styles.tlNote}>{entry.note}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {task.cancelReason && (
                      <div className={styles.alertNote} style={{ background: '#fff0f0', color: '#b91c1c', borderColor: '#fca5a5' }}>
                        <strong>Motivo de cancelación:</strong> {task.cancelReason}
                      </div>
                    )}
                    {task.status === 'reprogramado' && task.rescheduledTo && (
                      <div className={styles.alertNote} style={{ background: '#f0f4ff', color: '#3730a3', borderColor: '#a5b4fc' }}>
                        <strong>Reprogramado para:</strong> {fmtDate(task.rescheduledTo)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
