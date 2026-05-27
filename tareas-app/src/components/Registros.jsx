import { useState, useMemo } from 'react'
import { STATUSES, STATUS_LIST, getCategories } from '../utils/statuses'
import StatusBadge from './StatusBadge'
import styles from './Registros.module.css'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const SORT_OPTIONS = [
  { value: 'createdAt',  label: 'Más recientes'   },
  { value: 'title',      label: 'Nombre de tarea'  },
  { value: 'priority',   label: 'Prioridad'        },
  { value: 'status',     label: 'Estado'           },
  { value: 'startDate',  label: 'Fecha inicio'     },
  { value: 'endDate',    label: 'Deadline'         },
  { value: 'category',   label: 'Categoría'        },
  { value: 'totalTime',  label: 'Tiempo total'     },
]

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 }

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
    const next  = history[i + 1]
    const ms    = (next ? new Date(next.timestamp) : new Date()) - new Date(entry.timestamp)
    const s     = entry.toStatus
    result[s]   = (result[s] || 0) + ms
  }
  return result
}

function calcTotal(history) {
  if (!history?.length) return 0
  return new Date() - new Date(history[0].timestamp)
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field)
    return <span className={styles.sortIcon}>↕</span>
  return (
    <span className={`${styles.sortIcon} ${styles.sortIconActive}`}>
      {sortDir === 'asc' ? '↑' : '↓'}
    </span>
  )
}

export default function Registros({ tasks }) {
  const [search,      setSearch]      = useState('')
  const [filterCat,   setFilterCat]   = useState('all')
  const [filterStatus,setFilterStatus]= useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear,  setFilterYear]  = useState('all')
  const [expanded,    setExpanded]    = useState(null)
  const [sortField,   setSortField]   = useState('createdAt')
  const [sortDir,     setSortDir]     = useState('desc')

  const categories = getCategories()

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const years = useMemo(() => {
    const ys = [...new Set(tasks.map(t => (t.startDate || t.date || '').slice(0, 4)).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [tasks])

  const filtered = useMemo(() => {
    const list = tasks.filter(t => {
      const date      = t.startDate || t.date || ''
      const taskYear  = date.slice(0, 4)
      const taskMonth = date.slice(5, 7)
      const q         = search.toLowerCase()
      return (
        (filterCat    === 'all' || t.category === filterCat) &&
        (filterStatus === 'all' || t.status   === filterStatus) &&
        (filterYear   === 'all' || taskYear   === filterYear) &&
        (filterMonth  === 'all' || taskMonth  === filterMonth.padStart(2, '0')) &&
        (!q || t.title?.toLowerCase().includes(q) ||
               t.description?.toLowerCase().includes(q) ||
               t.category?.toLowerCase().includes(q))
      )
    })

    const mult = sortDir === 'asc' ? 1 : -1
    return list.sort((a, b) => {
      switch (sortField) {
        case 'title':
          return mult * (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
        case 'category':
          return mult * (a.category || '').toLowerCase().localeCompare((b.category || '').toLowerCase())
        case 'status': {
          const ai = STATUS_LIST.findIndex(s => s.value === a.status)
          const bi = STATUS_LIST.findIndex(s => s.value === b.status)
          return mult * (ai - bi)
        }
        case 'startDate': {
          const av = a.startDate || a.date || ''
          const bv = b.startDate || b.date || ''
          return mult * (av < bv ? -1 : av > bv ? 1 : 0)
        }
        case 'endDate': {
          const av = a.endDate || '9999-99-99'
          const bv = b.endDate || '9999-99-99'
          return mult * (av < bv ? -1 : av > bv ? 1 : 0)
        }
        case 'totalTime':
          return mult * (calcTotal(a.history || []) - calcTotal(b.history || []))
        case 'priority':
          return mult * ((PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0))
        default: // createdAt
          return mult * (new Date(a.createdAt) - new Date(b.createdAt))
      }
    })
  }, [tasks, search, filterCat, filterStatus, filterYear, filterMonth, sortField, sortDir])

  const statusCounts = STATUS_LIST
    .map(s => ({ ...s, count: tasks.filter(t => t.status === s.value).length }))
    .filter(s => s.count > 0)

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

      {/* ── Buscador ── */}
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

      {/* ── Filtros ── */}
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
          <button className={styles.clearBtn} onClick={() => {
            setFilterCat('all'); setFilterStatus('all')
            setFilterMonth('all'); setFilterYear('all'); setSearch('')
          }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Ordenar por ── */}
      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Ordenar por</span>
        <select
          value={sortField}
          onChange={e => { setSortField(e.target.value); setSortDir('desc') }}
          className={styles.select}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          className={`${styles.dirBtn} ${sortDir === 'asc' ? styles.dirBtnAsc : ''}`}
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          title="Cambiar dirección"
        >
          {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      <p className={styles.count}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No hay registros que coincidan.</div>
      ) : (
        <div className={styles.table}>

          {/* ── Cabecera con sort ── */}
          <div className={styles.thead}>
            <button
              className={`${styles.thBtn} ${sortField === 'title' ? styles.thActive : ''}`}
              onClick={() => handleSort('title')}
            >
              Tarea <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className={`${styles.thBtn} ${sortField === 'category' ? styles.thActive : ''}`}
              onClick={() => handleSort('category')}
            >
              Categoría <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className={`${styles.thBtn} ${sortField === 'status' ? styles.thActive : ''}`}
              onClick={() => handleSort('status')}
            >
              Estado <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className={`${styles.thBtn} ${sortField === 'startDate' ? styles.thActive : ''}`}
              onClick={() => handleSort('startDate')}
            >
              Inicio <SortIcon field="startDate" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className={`${styles.thBtn} ${sortField === 'endDate' ? styles.thActive : ''}`}
              onClick={() => handleSort('endDate')}
            >
              Deadline <SortIcon field="endDate" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className={`${styles.thBtn} ${sortField === 'totalTime' ? styles.thActive : ''}`}
              onClick={() => handleSort('totalTime')}
            >
              Tiempo total <SortIcon field="totalTime" sortField={sortField} sortDir={sortDir} />
            </button>
          </div>

          {/* ── Filas ── */}
          {filtered.map(task => {
            const history  = task.history || []
            const durations = calcDurations(history)
            const totalMs   = calcTotal(history)
            const isOpen    = expanded === task.id

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
                            const next  = history[i + 1]
                            const dur   = fmtDuration(next
                              ? new Date(next.timestamp) - new Date(entry.timestamp)
                              : new Date() - new Date(entry.timestamp))
                            const isLast = i === history.length - 1
                            return (
                              <div key={entry.id || i} className={styles.tlItem}>
                                <div className={styles.tlDot}
                                  style={{ background: STATUSES[entry.toStatus]?.color || '#9ca3af' }} />
                                {!isLast && <div className={styles.tlLine} />}
                                <div className={styles.tlBody}>
                                  <div className={styles.tlStates}>
                                    {entry.fromStatus && (
                                      <>
                                        <span className={styles.tlBadge}
                                          style={{ background: STATUSES[entry.fromStatus]?.bg, color: STATUSES[entry.fromStatus]?.textColor }}>
                                          {STATUSES[entry.fromStatus]?.label}
                                        </span>
                                        <span className={styles.tlArrow}>→</span>
                                      </>
                                    )}
                                    <span className={styles.tlBadge}
                                      style={{ background: STATUSES[entry.toStatus]?.bg, color: STATUSES[entry.toStatus]?.textColor }}>
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
                      <div className={styles.alertNote}
                        style={{ background: '#fff0f0', color: '#b91c1c', borderColor: '#fca5a5' }}>
                        <strong>Motivo de cancelación:</strong> {task.cancelReason}
                      </div>
                    )}
                    {task.status === 'reprogramado' && task.rescheduledTo && (
                      <div className={styles.alertNote}
                        style={{ background: '#f0f4ff', color: '#3730a3', borderColor: '#a5b4fc' }}>
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
