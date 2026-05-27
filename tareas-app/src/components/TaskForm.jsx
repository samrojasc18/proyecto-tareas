import { useState } from 'react'
import { todayStr } from '../utils/dates'
import { PRIORITIES, getCategories, addCategory } from '../utils/statuses'
import styles from './TaskForm.module.css'

export default function TaskForm({ onSubmit, onCancel, initialDate, initialData }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate || initialData?.date || initialDate || todayStr(),
    endDate: initialData?.endDate || '',
    time: initialData?.time || '',
    priority: initialData?.priority || 'medium',
    category: initialData?.category || '',
  })
  const [categories, setCategories] = useState(getCategories)
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAddCategory() {
    const name = newCat.trim()
    if (!name) return
    const updated = addCategory(name)
    setCategories(updated)
    set('category', name)
    setNewCat('')
    setAddingCat(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      endDate: form.endDate || null,
      time: form.time || '',
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label>Tarea</label>
        <input
          type="text"
          placeholder="¿Qué necesitas hacer?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className={styles.field}>
        <label>Descripción <span className={styles.optional}>(opcional)</span></label>
        <textarea
          placeholder="Añade detalles..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Fecha inicio</label>
          <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Deadline <span className={styles.optional}>(opcional)</span></label>
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={e => set('endDate', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field} style={{ maxWidth: 180 }}>
        <label>Hora <span className={styles.optional}>(opcional)</span></label>
        <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
      </div>

      <div className={styles.field}>
        <label>Prioridad</label>
        <div className={styles.pills}>
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              type="button"
              className={`${styles.pill} ${form.priority === p.value ? styles.pillActive : ''}`}
              style={form.priority === p.value
                ? { background: p.color, borderColor: p.color, color: '#fff' }
                : { borderColor: p.color, color: p.color }}
              onClick={() => set('priority', p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.catHeader}>
          <label>Categoría</label>
          <button
            type="button"
            className={styles.addCatBtn}
            onClick={() => setAddingCat(v => !v)}
          >
            {addingCat ? '× Cancelar' : '+ Nueva'}
          </button>
        </div>
        {addingCat && (
          <div className={styles.newCatRow}>
            <input
              type="text"
              placeholder="Nombre de categoría"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              autoFocus
            />
            <button type="button" className={styles.saveCatBtn} onClick={handleAddCategory}>
              Agregar
            </button>
          </div>
        )}
        <div className={styles.pills}>
          {categories.map(c => (
            <button
              key={c}
              type="button"
              className={`${styles.pill} ${form.category === c ? styles.pillActiveNeutral : ''}`}
              onClick={() => set('category', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>Cancelar</button>
        <button type="submit" className={styles.submit}>
          {initialData ? 'Guardar cambios' : 'Añadir tarea'}
        </button>
      </div>
    </form>
  )
}
