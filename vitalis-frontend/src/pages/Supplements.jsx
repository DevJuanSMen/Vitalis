import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pill, Check, Clock, ToggleLeft, ToggleRight, Trash2, Edit3 } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const CATEGORIES = [
  { value: 'protein', label: 'Proteína', emoji: '💪', color: 'bg-red-50 text-red-600 border-red-100' },
  { value: 'vitamin', label: 'Vitamina', emoji: '💊', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'mineral', label: 'Mineral', emoji: '🧪', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: 'hormone', label: 'Hormonal', emoji: '⚗️', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { value: 'preworkout', label: 'Pre-entreno', emoji: '⚡', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { value: 'other', label: 'Otro', emoji: '📦', color: 'bg-dark-800/50 text-white/70 border-white/5' },
]

const FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'twice_daily', label: '2 veces al día' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'as_needed', label: 'Según necesidad' },
]

const TIMES = [
  { value: 'morning', label: '🌅 Mañana' },
  { value: 'afternoon', label: '☀️ Tarde' },
  { value: 'night', label: '🌙 Noche' },
  { value: 'pre_workout', label: '🏋️ Pre-entreno' },
  { value: 'post_workout', label: '💪 Post-entreno' },
]

function getCat(val) { return CATEGORIES.find(c => c.value === val) || CATEGORIES[5] }

export default function Supplements() {
  const supplements = useQuery(api.supplements.getAll) || []
  const todayLogs = useQuery(api.supplements.getTodayLogs) || []
  const addSupplement = useMutation(api.supplements.add)
  const removeSupplement = useMutation(api.supplements.remove)
  const toggleActive = useMutation(api.supplements.toggleActive)
  const logIntake = useMutation(api.supplements.logIntake)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'protein', dose: '', frequency: 'daily', time_of_day: 'morning', notes: '' })

  const active = supplements.filter(s => s.active)
  const inactive = supplements.filter(s => !s.active)

  function isTaken(suppId) {
    const log = todayLogs.find(l => l.supplementId === suppId)
    return log?.taken || false
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.dose) return
    try {
      await addSupplement(form)
      setForm({ name: '', category: 'protein', dose: '', frequency: 'daily', time_of_day: 'morning', notes: '' })
      setShowForm(false)
    } catch (err) { console.error(err) }
  }

  const takenCount = active.filter(s => isTaken(s._id)).length
  const progress = active.length > 0 ? Math.round((takenCount / active.length) * 100) : 0

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Suplementación
          </h1>
          <p className="text-white/60 mt-1">Gestiona tus suplementos, proteínas y vitaminas.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Nuevo Suplemento
        </button>
      </div>

      {/* Daily Progress */}
      {active.length > 0 && (
        <motion.div variants={itemVars} className="glass-card bg-gradient-to-br from-white to-brand-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
              <Pill className="text-brand-500" size={20} /> Progreso del Día
            </h2>
            <span className="text-sm font-bold text-brand-600">{takenCount}/{active.length} tomados</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${progress === 100 ? 'bg-gradient-to-r from-brand-500 to-emerald-400' : 'bg-brand-500'}`}
            />
          </div>
          {progress === 100 && <p className="text-xs text-brand-600 font-medium mt-2">✅ ¡Completaste todos tus suplementos de hoy!</p>}
        </motion.div>
      )}

      {/* Active Supplements */}
      <motion.div variants={itemVars}>
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Activos ({active.length})</h3>
        {active.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Pill className="mx-auto text-white/30 mb-4" size={48} />
            <p className="text-white/60">No tienes suplementos registrados.</p>
            <p className="text-sm text-white/50 mt-1">Agrega proteínas, vitaminas, creatina o lo que necesites.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(s => {
              const cat = getCat(s.category)
              const taken = isTaken(s._id)
              return (
                <motion.div key={s._id} variants={itemVars} className={`bg-dark-800 border rounded-2xl p-5 transition-all group ${taken ? 'border-brand-200 bg-brand-50/30' : 'border-white/5 hover:border-brand-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg w-10 h-10 rounded-xl flex items-center justify-center border ${cat.color}`}>{cat.emoji}</span>
                      <div>
                        <h4 className="font-bold text-white/90">{s.name}</h4>
                        <p className="text-xs text-white/50">{s.dose} · {FREQUENCIES.find(f => f.value === s.frequency)?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleActive({ id: s._id })} className="p-1.5 text-white/50 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors" title="Pausar">
                        <ToggleRight size={16} />
                      </button>
                      <button onClick={() => removeSupplement({ id: s._id })} className="p-1.5 text-white/50 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {s.time_of_day && (
                    <div className="flex items-center gap-1 text-xs text-white/50 mb-3">
                      <Clock size={12} /> {TIMES.find(t => t.value === s.time_of_day)?.label}
                    </div>
                  )}
                  {s.notes && <p className="text-xs text-white/50 mb-3 bg-dark-800/50 p-2 rounded-lg">{s.notes}</p>}
                  <button
                    onClick={() => logIntake({ supplementId: s._id })}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      taken
                        ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                        : 'bg-white/5 text-white/70 hover:bg-brand-50 hover:text-brand-600'
                    }`}
                  >
                    <Check size={16} /> {taken ? 'Tomado ✓' : 'Marcar como tomado'}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <motion.div variants={itemVars}>
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Pausados ({inactive.length})</h3>
          <div className="space-y-2">
            {inactive.map(s => {
              const cat = getCat(s.category)
              return (
                <div key={s._id} className="flex items-center justify-between bg-dark-800/50 border border-white/5 rounded-xl p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <div>
                      <span className="font-medium text-white/70">{s.name}</span>
                      <span className="text-xs text-white/50 ml-2">{s.dose}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive({ id: s._id })} className="p-1.5 text-white/50 hover:text-brand-500 rounded-lg hover:bg-brand-50" title="Reactivar">
                      <ToggleLeft size={16} />
                    </button>
                    <button onClick={() => removeSupplement({ id: s._id })} className="p-1.5 text-white/50 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-dark-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white/90 flex items-center gap-2"><Pill className="text-brand-500"/> Nuevo Suplemento</h2>
                <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white/70 bg-white/5 rounded-full p-1.5 hover:bg-white/10"><X size={20}/></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Nombre</label>
                  <input required className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ej. Proteína Whey, Creatina, Vitamina D..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c.value} type="button" onClick={() => setForm({...form, category: c.value})}
                        className={`text-xs font-medium py-2.5 px-2 rounded-xl border transition-all flex items-center justify-center gap-1 ${form.category === c.value ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm' : 'border-white/5 bg-dark-800 text-white/60 hover:bg-dark-800/50'}`}>
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Dosis</label>
                    <input required className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ej. 5g, 1 scoop" value={form.dose} onChange={e => setForm({...form, dose: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Frecuencia</label>
                    <select className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                      {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Momento del día</label>
                  <select className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value={form.time_of_day} onChange={e => setForm({...form, time_of_day: e.target.value})}>
                    {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Notas (opcional)</label>
                  <textarea rows={2} className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Ej. Tomar con comida, no mezclar con..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-medium text-white/70 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary py-3">Guardar suplemento</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
