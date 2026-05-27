export const STATUSES = {
  'pendiente':    { label: 'Pendiente',    color: '#7aa8d0', bg: '#edf4fb', textColor: '#2d6a9f' },
  'en-curso':     { label: 'En curso',     color: '#4a90e2', bg: '#e0eeff', textColor: '#1e4fa0' },
  'realizado':    { label: 'Realizado',    color: '#43aa8b', bg: '#e0f5ee', textColor: '#1a6e56' },
  'en-revision':  { label: 'En Revisión',  color: '#f0a500', bg: '#fff8e0', textColor: '#7a5200' },
  'reprogramado': { label: 'Reprogramado', color: '#6a9de0', bg: '#eaf1ff', textColor: '#1a3a7a' },
  'cancelado':    { label: 'Cancelado',    color: '#e07a7a', bg: '#fdf0f0', textColor: '#8b2a2a' },
}

export const STATUS_LIST = Object.entries(STATUSES).map(([value, s]) => ({ value, ...s }))

const CATEGORIES_KEY = 'tareas-app-categories'
const DEFAULT_CATEGORIES = ['Ventas', 'Deacs', 'Proyecciones', 'Facturación', 'BI', 'Procesos', 'Equipos']

export function getCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function addCategory(name) {
  const cats = getCategories()
  if (cats.includes(name)) return cats
  const updated = [...cats, name]
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated))
  return updated
}

export function removeCategory(name) {
  const cats = getCategories().filter(c => c !== name)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats))
  return cats
}

export const PRIORITIES = [
  { value: 'low',    label: 'Baja',  color: '#10b981' },
  { value: 'medium', label: 'Media', color: '#f59e0b' },
  { value: 'high',   label: 'Alta',  color: '#ef4444' },
]
