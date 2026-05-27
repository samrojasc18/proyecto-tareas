import { useState, useEffect, useRef } from 'react'
import { useTasks } from './hooks/useTasks'
import Dashboard from './components/Dashboard'
import Calendar from './components/Calendar'
import Registros from './components/Registros'
import styles from './App.module.css'

const NAV = [
  { id: 'dashboard', label: 'Hoy',        icon: '☀️',  desc: 'Vista del día' },
  { id: 'calendar',  label: 'Calendario', icon: '📅',  desc: 'Vista mensual' },
  { id: 'registros', label: 'Registros',  icon: '📊',  desc: 'Historial' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [open, setOpen] = useState(true)
  const [pinned, setPinned] = useState(true)
  const sidebarRef = useRef()
  const { tasks, addTask, updateTask, deleteTask, changeStatus } = useTasks()

  useEffect(() => {
    if (pinned || !open) return
    function handler(e) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pinned, open])

  const collapsed = !open
  const props = { tasks, addTask, updateTask, deleteTask, changeStatus }

  return (
    <div className={`${styles.layout} ${!pinned && open ? styles.hasOverlay : ''}`}>
      {!pinned && open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${!pinned ? styles.floating : ''}`}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>✅</span>
            {!collapsed && <span className={styles.brandName}>Mis Tareas</span>}
          </div>

          <div className={styles.sidebarActions}>
            {!collapsed && (
              <button
                className={`${styles.pinBtn} ${pinned ? styles.pinned : ''}`}
                onClick={() => setPinned(v => !v)}
                title={pinned ? 'Desfijar panel' : 'Fijar panel'}
              >
                📌
              </button>
            )}
            <button
              className={styles.toggleBtn}
              onClick={() => setOpen(v => !v)}
              title={collapsed ? 'Abrir panel' : 'Cerrar panel'}
            >
              {collapsed ? '›' : '‹'}
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`${styles.navItem} ${tab === n.id ? styles.navActive : ''}`}
              onClick={() => { setTab(n.id); if (!pinned) setOpen(false) }}
              title={collapsed ? n.label : undefined}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {!collapsed && (
                <div className={styles.navText}>
                  <span className={styles.navLabel}>{n.label}</span>
                  <span className={styles.navDesc}>{n.desc}</span>
                </div>
              )}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className={styles.sidebarFooter}>
            <span className={styles.taskCount}>
              {tasks.filter(t => ['pendiente','en-curso'].includes(t.status)).length} tareas activas
            </span>
          </div>
        )}
      </aside>

      <div className={styles.mainWrap}>
        {collapsed && (
          <button className={styles.openBtn} onClick={() => setOpen(true)} title="Abrir panel">
            ›
          </button>
        )}

        <main className={styles.main}>
          {tab === 'dashboard' && <Dashboard {...props} onGoToCalendar={() => setTab('calendar')} />}
          {tab === 'calendar'  && <Calendar  {...props} onGoHome={() => setTab('dashboard')} />}
          {tab === 'registros' && <Registros tasks={tasks} />}
        </main>
      </div>

      <div className={styles.mobileBar}>
        {NAV.map(n => (
          <button key={n.id} className={`${styles.mobileTab} ${tab === n.id ? styles.mobileTabActive : ''}`} onClick={() => setTab(n.id)}>
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
