import { useState, useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTasks } from './hooks/useTasks'
import Dashboard from './components/Dashboard'
import Calendar from './components/Calendar'
import Registros from './components/Registros'
import AuthPage from './components/Auth/AuthPage'
import styles from './App.module.css'

const NAV = [
  { id: 'dashboard', label: 'Hoy',        icon: '☀️',  desc: 'Vista del día' },
  { id: 'calendar',  label: 'Calendario', icon: '📅',  desc: 'Vista mensual' },
  { id: 'registros', label: 'Registros',  icon: '📊',  desc: 'Historial' },
]

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    tasks, loading: tasksLoading,
    categories, hasMigration,
    addTask, updateTask, deleteTask, changeStatus,
    addCategory, migrateLegacyData, dismissMigration,
  } = useTasks()

  const [tab,     setTab]     = useState('dashboard')
  const [open,    setOpen]    = useState(true)
  const [pinned,  setPinned]  = useState(true)
  const [migrMsg, setMigrMsg] = useState('')
  const sidebarRef = useRef()

  useEffect(() => {
    if (pinned || !open) return
    function handler(e) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pinned, open])

  if (authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingIcon}>✅</span>
        <span className={styles.loadingText}>Cargando…</span>
      </div>
    )
  }

  if (!user) return <AuthPage />

  const collapsed = !open
  const taskProps = { tasks, addTask, updateTask, deleteTask, changeStatus, categories, addCategory }

  async function handleMigrate() {
    const n = await migrateLegacyData()
    setMigrMsg(n > 0 ? `${n} tareas importadas correctamente.` : 'No se pudo importar. Revisa la consola.')
    setTimeout(() => setMigrMsg(''), 4000)
  }

  return (
    <div className={`${styles.layout} ${!pinned && open ? styles.hasOverlay : ''}`}>
      {!pinned && open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* ── Migration banner ── */}
      {hasMigration && (
        <div className={styles.migrationBanner}>
          <span>Tienes tareas guardadas localmente. ¿Importarlas a tu cuenta en la nube?</span>
          <div className={styles.migrationActions}>
            <button className={styles.migrImport} onClick={handleMigrate}>Importar</button>
            <button className={styles.migrDismiss} onClick={dismissMigration}>Ahora no</button>
          </div>
        </div>
      )}
      {migrMsg && <div className={styles.migrToast}>{migrMsg}</div>}

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
            <div className={styles.userInfo}>
              <span className={styles.userEmail} title={user.email}>{user.email}</span>
              <span className={styles.taskCount}>
                {tasks.filter(t => ['pendiente', 'en-curso'].includes(t.status)).length} tareas activas
              </span>
            </div>
            <button className={styles.logoutBtn} onClick={signOut} title="Cerrar sesión">
              Salir
            </button>
          </div>
        )}
      </aside>

      <div className={styles.mainWrap}>
        {collapsed && (
          <button className={styles.openBtn} onClick={() => setOpen(true)} title="Abrir panel">›</button>
        )}

        <main className={styles.main}>
          {tasksLoading ? (
            <div className={styles.tasksLoading}>Cargando tareas…</div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard {...taskProps} onGoToCalendar={() => setTab('calendar')} />}
              {tab === 'calendar'  && <Calendar  {...taskProps} onGoHome={() => setTab('dashboard')} />}
              {tab === 'registros' && <Registros tasks={tasks} />}
            </>
          )}
        </main>
      </div>

      <div className={styles.mobileBar}>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`${styles.mobileTab} ${tab === n.id ? styles.mobileTabActive : ''}`}
            onClick={() => setTab(n.id)}
          >
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
