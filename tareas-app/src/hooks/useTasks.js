import { useState, useEffect } from 'react'

const STORAGE_KEY = 'tareas-app-data'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function migrateTask(task) {
  const status = task.status || (task.completed ? 'realizado' : 'pendiente')
  const startDate = task.startDate || task.date || new Date().toISOString().slice(0, 10)
  const history = task.history || [{
    id: generateId(),
    timestamp: task.createdAt || new Date().toISOString(),
    fromStatus: null,
    toStatus: status,
    note: 'Tarea creada',
  }]
  return { ...task, status, startDate, endDate: task.endDate || null, history, rescheduledTo: task.rescheduledTo || null, cancelReason: task.cancelReason || null }
}

export function useTasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved).map(migrateTask) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  function addTask(taskData) {
    const now = new Date().toISOString()
    const task = {
      id: generateId(),
      createdAt: now,
      status: 'pendiente',
      priority: 'medium',
      rescheduledTo: null,
      cancelReason: null,
      ...taskData,
      startDate: taskData.startDate || taskData.date || now.slice(0, 10),
      endDate: taskData.endDate || null,
      history: [{
        id: generateId(),
        timestamp: now,
        fromStatus: null,
        toStatus: 'pendiente',
        note: 'Tarea creada',
      }],
    }
    setTasks(prev => [...prev, task])
    return task
  }

  function updateTask(id, changes) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...changes } : t)))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function changeStatus(id, newStatus, metadata = {}) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const entry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        fromStatus: t.status,
        toStatus: newStatus,
        note: metadata.note || null,
        rescheduledTo: metadata.rescheduledTo || null,
        cancelReason: metadata.cancelReason || null,
      }
      return {
        ...t,
        status: newStatus,
        history: [...(t.history || []), entry],
        rescheduledTo: metadata.rescheduledTo != null ? metadata.rescheduledTo : t.rescheduledTo,
        cancelReason: metadata.cancelReason != null ? metadata.cancelReason : t.cancelReason,
      }
    }))
  }

  function getTasksByDate(dateStr) {
    return tasks.filter(t => {
      const start = t.startDate || t.date
      const end = t.endDate
      if (end) return start <= dateStr && end >= dateStr
      return start === dateStr
    })
  }

  return { tasks, addTask, updateTask, deleteTask, changeStatus, getTasksByDate }
}
