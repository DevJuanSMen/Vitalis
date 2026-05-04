import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ChefHat } from 'lucide-react'
import defaultRecipes from '../data/recipes'

const STORAGE_KEY = 'nutriapp:recipes'

export default function Recipes() {
  const [recipes, setRecipes] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : defaultRecipes
    } catch {
      return defaultRecipes
    }
  })

  const [form, setForm] = useState({ name: '', ingredients: '', calories: '', image: '', instructions: '' })
  const [selected, setSelected] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
    } catch (e) {
      console.error(e)
    }
  }, [recipes])

  function addRecipe(e) {
    e.preventDefault()
    if (!form.name || !form.calories) return
    const newR = {
      id: Date.now(),
      name: form.name,
      ingredients: form.ingredients ? form.ingredients.split(',').map((s) => s.trim()) : [],
      calories: Number(form.calories),
      image: form.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
      instructions: form.instructions || '',
    }
    setRecipes([newR, ...recipes])
    setForm({ name: '', ingredients: '', calories: '', image: '', instructions: '' })
    setOpenForm(false)
  }

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="max-w-6xl mx-auto py-8 lg:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Recetario Saludable
          </h1>
          <p className="text-white/60 mt-1">Explora ideas nutritivas y crea tus propias recetas.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/50" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar receta o ingrediente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button onClick={() => setOpenForm(true)} className="btn-primary whitespace-nowrap">
            <Plus size={18} /> Nueva Receta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((r, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            key={r.id} 
            className="group glass-card p-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-white/5/50 hover:border-brand-200 flex flex-col"
            onClick={() => setSelected(r)}
          >
            <div className="h-48 w-full relative overflow-hidden shrink-0">
              <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-md pr-4">{r.name}</p>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-brand-50 text-brand-600 text-xs font-bold px-2.5 py-1 rounded-full">{r.calories} kcal</span>
                <span className="text-xs font-medium text-white/60 flex items-center gap-1"><ChefHat size={12}/> {r.ingredients.length} Ingredientes</span>
              </div>
              <p className="text-sm text-white/60 line-clamp-2">
                {r.ingredients.join(', ')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <ChefHat className="mx-auto text-white/40 mb-4" size={48} />
          <h3 className="text-xl font-medium text-white/70">No encontramos recetas</h3>
          <p className="text-white/50 mt-2">Intenta buscar con otros términos o agrega una nueva.</p>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-dark-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="relative h-64 shrink-0">
                <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors">
                  <X size={20} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>
              
              <div className="p-8 pt-0 relative -mt-8 bg-dark-800 rounded-t-3xl">
                <div className="flex justify-between items-start mb-6 pt-8">
                  <h2 className="text-2xl font-bold text-white/90">{selected.name}</h2>
                  <span className="bg-brand-100 text-brand-700 text-sm font-bold px-4 py-1.5 rounded-full">{selected.calories} kcal</span>
                </div>
                
                <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2"><ChefHat size={16}/> Ingredientes</h4>
                <div className="flex flex-wrap gap-2 mb-8">
                  {selected.ingredients.map((ing, i) => (
                    <span key={i} className="bg-dark-800/50 border border-white/5 text-white/70 px-3 py-1 rounded-lg text-sm font-medium">{ing}</span>
                  ))}
                </div>

                {selected.instructions && (
                  <div>
                    <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Preparación</h4>
                    <p className="text-white/70 leading-relaxed whitespace-pre-wrap bg-dark-800/50/50 p-4 rounded-2xl border border-white/5">{selected.instructions}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Recipe Form Modal */}
      <AnimatePresence>
        {openForm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white/90 flex items-center gap-2">
                  <ChefHat className="text-brand-500" />
                  Agregar Nueva Receta
                </h2>
                <button onClick={() => setOpenForm(false)} className="text-white/50 hover:text-white/70 transition-colors bg-white/5 rounded-full p-1.5 hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addRecipe} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Nombre de la receta</label>
                    <input autoFocus required className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ej. Tostadas francesas ligeras" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Calorías estimadas</label>
                    <input required type="number" className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ej. 350" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">URL de Imagen (Opcional)</label>
                  <input className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Ingredientes (separados por coma)</label>
                  <input required className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Pan integral, fresas, claras de huevo..." value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Instrucciones (Opcional)</label>
                  <textarea rows={4} className="w-full p-3 bg-dark-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none" placeholder="1. Remoja el pan..." value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setOpenForm(false)} className="px-6 py-3 font-medium text-white/70 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary py-3">Guardar receta</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
