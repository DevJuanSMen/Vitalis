import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Bot, User, Loader2, Lightbulb, Trash2, ChefHat, ArrowRight } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { chatWithNutriBot, generateRecipe, getDailyTip } from '../services/groqAI'
import { recommendedCalories } from '../utils/nutrition'

const SUGGESTIONS = [
  '¿Qué puedo cenar ligero?',
  'Rutina de empuje para hipertrofia',
  'Snacks saludables',
  '¿Cuánta agua debo tomar?',
]

export default function AIChat() {
  const profile = useQuery(api.profile.get)
  const todayMeals = useQuery(api.meals.getToday) || []
  const waterLog = useQuery(api.waterLogs.getToday)
  const dbMessages = useQuery(api.chat.getMessages) || []
  const addMessage = useMutation(api.chat.addMessage)
  const clearHistory = useMutation(api.chat.clearHistory)
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [genRecipe, setGenRecipe] = useState(false)
  const scrollRef = useRef(null)

  const total = todayMeals.reduce((s, i) => s + (i.calories || 0), 0)
  
  const target = profile ? recommendedCalories({ 
    sex: profile.sex_assigned || 'male', 
    weightKg: profile.weight_kg || 70, 
    heightCm: profile.height_cm || 170, 
    age: profile.age || 25, 
    activity: profile.activity_level || 'moderate',
    goal: profile.goal_type || 'maintain'
  }) : 2000

  const userContext = {
    perfil: profile ? { edad: profile.age, peso_kg: profile.weight_kg, altura_cm: profile.height_cm, sexo: profile.sex_assigned, actividad: profile.activity_level } : null,
    meta_calorica: target, 
    consumido_hoy: total,
    comidas_hoy: todayMeals.map(m => ({ nombre: m.name, calorias: m.calories, proteina: m.protein, carbos: m.carbs, grasa: m.fat })),
    agua_hoy: waterLog?.glasses || 0,
  }

  const allMessages = [...dbMessages].reverse()

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight 
    }
  }, [allMessages, loading])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    
    setInput('')
    setLoading(true)
    
    await addMessage({ role: 'user', content: msg })
    
    try {
      const history = allMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await chatWithNutriBot([...history, { role: 'user', content: msg }], userContext)
      await addMessage({ role: 'assistant', content: res })
    } catch (err) {
      await addMessage({ role: 'assistant', content: '❌ Error al conectar con la IA. Por favor intenta de nuevo.' })
    } finally { 
      setLoading(false) 
    }
  }

  async function handleGenRecipe() {
    setGenRecipe(true)
    try {
      const r = await generateRecipe(profile ? `Para persona de ${profile.age} años, ${profile.weight_kg}kg, objetivo ${profile.goal_type}` : '')
      if (r) {
        const txt = `🍳 **${r.name}**\n⏱️ ${r.time || '30 min'} | ${r.difficulty || 'Media'}\n🔥 ${r.calories} kcal | P:${r.protein}g C:${r.carbs}g G:${r.fat}g\n\n**Ingredientes:**\n${(r.ingredients || []).map(i => `• ${i}`).join('\n')}\n\n**Preparación:**\n${r.instructions || ''}`
        await addMessage({ role: 'assistant', content: txt })
      }
    } catch {} finally { setGenRecipe(false) }
  }

  async function handleClear() {
    if (window.confirm('¿Borrar todo el historial de chat?')) {
      await clearHistory()
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 flex flex-col px-4" style={{ height: 'calc(100vh - 100px)' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
            <Sparkles className="text-brand-500" size={28} /> VITALIS AI
          </h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">Tu asistente inteligente personalizado.</p>
        </div>
        {allMessages.length > 0 && (
          <button onClick={handleClear} className="p-2.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-white/5">
            <Trash2 size={18}/>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-dark-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 mb-6 text-[10px] md:text-xs font-black uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-2 text-brand-400">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Meta: <span className="text-white">{target} kcal</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-white/40">Consumido: <span className="text-white">{total} kcal</span></div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-white/40">Agua: <span className="text-white">{waterLog?.glasses || 0} vasos</span></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-2 pb-6 custom-scrollbar">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600 to-emerald-500 flex items-center justify-center text-white mb-8 shadow-2xl shadow-brand-500/20"
            >
              <Bot size={40} />
            </motion.div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-3">¡Hola! Soy VITALIS AI 🧬</h2>
            <p className="text-white/40 mb-10 max-w-sm text-sm">Pregúntame sobre alimentación, pide recetas o planea tu próxima rutina de entrenamiento.</p>
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-dark-900/60 border border-brand-500/10 rounded-3xl p-6 max-w-sm mb-10 text-left relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-500/5 blur-2xl rounded-full" />
              <div className="flex items-center gap-2 text-brand-400 font-black uppercase tracking-widest text-[10px] mb-3">
                <Lightbulb size={14} /> Tip del día
              </div>
              <p className="text-sm text-white/70 leading-relaxed italic">"{getDailyTip()}"</p>
            </motion.div>

            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="text-[10px] font-black uppercase tracking-widest text-white/50 bg-dark-900 border border-white/5 px-5 py-3 rounded-2xl hover:border-brand-500 hover:text-brand-400 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          allMessages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white shrink-0 mt-1 shadow-lg shadow-brand-500/10">
                  <Bot size={18}/>
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-6 py-4 ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-none shadow-xl shadow-brand-500/10' : 'bg-dark-900/80 border border-white/5 text-white/90 rounded-bl-none shadow-sm'}`}>
                <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[8px] uppercase font-bold mt-2 opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0 mt-1">
                  <User size={18}/>
                </div>
              )}
            </motion.div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-white shrink-0 mt-1">
              <Bot size={18}/>
            </div>
            <div className="bg-dark-900/80 border border-white/5 rounded-3xl rounded-bl-none px-6 py-5 shadow-sm">
              <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase tracking-widest">
                <Loader2 className="animate-spin" size={14}/> 
                Analizando biometría...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <div className="flex gap-3 items-end max-w-4xl mx-auto w-full">
          {!allMessages.length && (
            <button onClick={handleGenRecipe} disabled={genRecipe} className="hidden md:flex p-4 bg-dark-900 border border-white/5 hover:border-brand-500 text-white/40 hover:text-brand-400 rounded-2xl transition-all group">
              {genRecipe ? <Loader2 className="animate-spin" size={20}/> : <ChefHat size={20} className="group-hover:rotate-12 transition-transform"/>}
            </button>
          )}
          
          <div className="flex-1 relative group">
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} 
              placeholder="Haz una pregunta o pide una rutina..." 
              rows={1} 
              className="w-full px-6 py-4 pr-16 bg-dark-900 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-2xl resize-none text-sm text-white placeholder:text-white/20" 
              style={{ minHeight: 56, maxHeight: 150 }} 
            />
            <button 
              onClick={() => sendMessage()} 
              disabled={!input.trim() || loading} 
              className="absolute right-2.5 bottom-2.5 p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all disabled:opacity-20 shadow-lg shadow-brand-500/20"
            >
              <Send size={18}/>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-white/20 mt-4 font-bold uppercase tracking-widest">VITALIS AI puede cometer errores. Consulta con un profesional.</p>
      </div>
    </div>
  )
}
