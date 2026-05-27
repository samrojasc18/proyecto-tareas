import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DEFAULT_CATEGORIES = ['Ventas', 'Deacs', 'Proyecciones', 'Facturación', 'BI', 'Procesos', 'Equipos']
const LEGACY_TASKS_KEY = 'tareas-app-data'
const LEGACY_CATS_KEY  = 'tareas-app-categories'

// ── Format converters ──────────────────────────────────────────────────────

function dbToTask(row) {
  return {
    id:            row.id,
    createdAt:     row.created_at,
    title:         row.title,
    description:   row.description  ?? '',
    startDate:     row.start_date,
    endDate:       row.end_date     ?? null,
    time:          row.time         ?? '',
    status:        row.status,
    priority:      row.priority,
    category:      row.category     ?? '',
    rescheduledTo: row.rescheduled_to ?? null,
    cancelReason:  row.cancel_reason  ?? null,
    history:       row.history      ?? [],
  }
}

function taskToDb(task, userId) {
  return {
    id:              task.id,
    user_id:         userId,
    created_at:      task.createdAt,
    title:           task.title,
    description:     task.description  || null,
    start_date:      task.startDate,
    end_date:        task.endDate      || null,
    time:            task.time         || null,
    status:          task.status,
    priority:        task.priority,
    category:        task.category     || null,
    rescheduled_to:  task.rescheduledTo || null,
    cancel_reason:   task.cancelReason  || null,
    history:         task.history      ?? [],
  }
}

function changesToDb(changes) {
  const db = {}
  if (changes.title         !== undefined) db.title          = changes.title
  if (changes.description   !== undefined) db.description    = changes.description   || null
  if (changes.startDate     !== undefined) db.start_date     = changes.startDate
  if (changes.endDate       !== undefined) db.end_date       = changes.endDate       || null
  if (changes.time          !== undefined) db.time           = changes.time          || null
  if (changes.status        !== undefined) db.status         = changes.status
  if (changes.priority      !== undefined) db.priority       = changes.priority
  if (changes.category      !== undefined) db.category       = changes.category      || null
  if (changes.rescheduledTo !== undefined) db.rescheduled_to = changes.rescheduledTo || null
  if (changes.cancelReason  !== undefined) db.cancel_reason  = changes.cancelReason  || null
  if (changes.history       !== undefined) db.history        = changes.history
  return db
}

// ── Legacy migration helper ────────────────────────────────────────────────

function migrateLegacyTask(task) {
  const status    = task.status || (task.completed ? 'realizado' : 'pendiente')
  const startDate = task.startDate || task.date || new Date().toISOString().slice(0, 10)
  const history   = task.history || [{
    id:         crypto.randomUUID(),
    timestamp:  task.createdAt || new Date().toISOString(),
    fromStatus: null,
    toStatus:   status,
    note:       'Tarea creada',
  }]
  return { ...task, status, startDate, endDate: task.endDate || null, history }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useTasks() {
  const { user } = useAuth()
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [categories,   setCategories]   = useState(DEFAULT_CATEGORIES)
  const [hasMigration, setHasMigration] = useState(false)

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data.map(dbToTask))
      // Detect legacy localStorage data on first login (0 cloud tasks)
      if (data.length === 0) {
        try {
          const stored = localStorage.getItem(LEGACY_TASKS_KEY)
          const legacy = stored ? JSON.parse(stored) : []
          if (legacy.length > 0) setHasMigration(true)
        } catch { /* ignore */ }
      }
    }

    setLoading(false)
  }, [user])

  // Load / initialize categories
  const loadCategories = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('user_settings')
      .select('categories')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data?.categories?.length) {
      setCategories(data.categories)
    } else {
      // First time: seed with legacy or defaults
      let initial = DEFAULT_CATEGORIES
      try {
        const stored = localStorage.getItem(LEGACY_CATS_KEY)
        if (stored) initial = JSON.parse(stored)
      } catch { /* ignore */ }

      await supabase.from('user_settings').upsert({ user_id: user.id, categories: initial })
      setCategories(initial)
    }
  }, [user])

  useEffect(() => {
    loadTasks()
    loadCategories()
  }, [loadTasks, loadCategories])

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function addTask(taskData) {
    const id  = crypto.randomUUID()
    const now = new Date().toISOString()

    const task = {
      id,
      createdAt:     now,
      status:        'pendiente',
      priority:      'medium',
      rescheduledTo: null,
      cancelReason:  null,
      description:   '',
      time:          '',
      ...taskData,
      startDate: taskData.startDate || taskData.date || now.slice(0, 10),
      endDate:   taskData.endDate   || null,
      history: [{
        id:         crypto.randomUUID(),
        timestamp:  now,
        fromStatus: null,
        toStatus:   taskData.status || 'pendiente',
        note:       'Tarea creada',
      }],
    }

    // Optimistic update
    setTasks(prev => [task, ...prev])

    const { error } = await supabase.from('tasks').insert(taskToDb(task, user.id))
    if (error) {
      setTasks(prev => prev.filter(t => t.id !== id))
      console.error('Error al crear tarea:', error.message)
    }

    return task
  }

  async function updateTask(id, changes) {
    const snapshot = tasks.find(t => t.id === id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))

    const { error } = await supabase
      .from('tasks')
      .update(changesToDb(changes))
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      // Revert
      if (snapshot) setTasks(prev => prev.map(t => t.id === id ? snapshot : t))
      console.error('Error al actualizar tarea:', error.message)
    }
  }

  async function deleteTask(id) {
    const snapshot = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      if (snapshot) setTasks(prev => [snapshot, ...prev])
      console.error('Error al eliminar tarea:', error.message)
    }
  }

  async function changeStatus(id, newStatus, metadata = {}) {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const entry = {
      id:            crypto.randomUUID(),
      timestamp:     new Date().toISOString(),
      fromStatus:    task.status,
      toStatus:      newStatus,
      note:          metadata.note         || null,
      rescheduledTo: metadata.rescheduledTo || null,
      cancelReason:  metadata.cancelReason  || null,
    }

    return updateTask(id, {
      status:        newStatus,
      history:       [...(task.history || []), entry],
      rescheduledTo: metadata.rescheduledTo != null ? metadata.rescheduledTo : task.rescheduledTo,
      cancelReason:  metadata.cancelReason  != null ? metadata.cancelReason  : task.cancelReason,
    })
  }

  function getTasksByDate(dateStr) {
    return tasks.filter(t => {
      const start = t.startDate || t.date
      const end   = t.endDate
      if (end) return start <= dateStr && end >= dateStr
      return start === dateStr
    })
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async function addCategory(name) {
    if (categories.includes(name)) return categories
    const updated = [...categories, name]
    setCategories(updated)
    await supabase.from('user_settings').upsert({ user_id: user.id, categories: updated })
    return updated
  }

  // ── Legacy migration ──────────────────────────────────────────────────────

  async function migrateLegacyData() {
    try {
      const stored = localStorage.getItem(LEGACY_TASKS_KEY)
      if (!stored) return 0
      const legacy = JSON.parse(stored).map(migrateLegacyTask)
      if (!legacy.length) return 0

      const rows = legacy.map(t => ({
        id:              crypto.randomUUID(),
        user_id:         user.id,
        created_at:      t.createdAt || new Date().toISOString(),
        title:           t.title     || 'Sin título',
        description:     t.description  || null,
        start_date:      t.startDate,
        end_date:        t.endDate       || null,
        time:            t.time          || null,
        status:          t.status        || 'pendiente',
        priority:        t.priority      || 'medium',
        category:        t.category      || null,
        rescheduled_to:  t.rescheduledTo || null,
        cancel_reason:   t.cancelReason  || null,
        history:         t.history       || [],
      }))

      const { error } = await supabase.from('tasks').insert(rows)
      if (!error) {
        localStorage.removeItem(LEGACY_TASKS_KEY)
        localStorage.removeItem(LEGACY_CATS_KEY)
        setHasMigration(false)
        await loadTasks()
        return rows.length
      }
      return 0
    } catch (e) {
      console.error('Error de migración:', e)
      return 0
    }
  }

  function dismissMigration() {
    setHasMigration(false)
  }

  return {
    tasks,
    loading,
    categories,
    hasMigration,
    addTask,
    updateTask,
    deleteTask,
    changeStatus,
    getTasksByDate,
    addCategory,
    migrateLegacyData,
    dismissMigration,
  }
}
