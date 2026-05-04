import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Search, CheckCircle, Clock, Zap, X, Sparkles, Brain, ArrowRight, Flame, Target, Activity, ChevronRight, Save } from 'lucide-react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { generateGroqResponse } from '../services/groqAI'

const MUSCLE_ICONS = {
  chest: <Target className="text-red-400" size={18} />,
  back: <Activity className="text-blue-400" size={18} />,
  legs: <Zap className="text-orange-400" size={18} />,
  shoulders: <Activity className="text-purple-400" size={18} />,
  arms: <Dumbbell className="text-yellow-400" size={18} />,
  abs: <Target className="text-green-400" size={18} />,
  cardio: <Flame className="text-rose-500" size={18} />,
  default: <Dumbbell className="text-brand-400" size={18} />
}

export default function Workouts() {
  const workouts = useQuery(api.workouts.getWorkouts) || []
  const todayStr = new Date().toISOString().split('T')[0]
  const todayLogs = useQuery(api.workouts.getLogs, { date: todayStr }) || []
  const profile = useQuery(api.profile.get)
  const bodyLogs = useQuery(api.bodyLogs.getLogs) || []
  
  const addWorkout = useMutation(api.workouts.addWorkout)
  const logWorkout = useMutation(api.workouts.logWorkout)
  const updateLogProgress = useMutation(api.workouts.updateLogProgress)
  const deleteWorkout = useMutation(api.workouts.deleteWorkout)

  const [showForm, setShowForm] = useState(false)
  const [showAiForm, setShowAiForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('library') // library, logs, weekly

  const [activeWorkout, setActiveWorkout] = useState(null)
  const [activeLog, setActiveLog] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    difficulty: 'intermediate',
    exercises: [{ name: '', sets: 3, reps: '10', rest: '60s', muscleGroup: 'chest' }]
  })

  const [aiPrompt, setAiPrompt] = useState('')

  // Check for in-progress workout on mount or when logs change
  useEffect(() => {
    if (activeWorkout) {
      const log = todayLogs.find(l => l.workoutId === activeWorkout._id)
      if (log) {
        setActiveLog(log)
        setCompletedExercises(log.completedExercises || [])
      }
    }
  }, [todayLogs, activeWorkout])

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }

  async function handleAddManual(e) {
    e.preventDefault()
    if (!form.name || form.exercises.length === 0) return
    await addWorkout(form)
    setShowForm(false)
    setForm({ name: '', description: '', difficulty: 'intermediate', exercises: [{ name: '', sets: 3, reps: '10', rest: '60s', muscleGroup: 'chest' }] })
  }

  async function handleGenerateAI(e) {
    e.preventDefault()
    if (!aiPrompt) return
    setIsGenerating(true)
    try {
      const recentAnalysis = bodyLogs.find(l => l.aiAnalysis)?.aiAnalysis ? JSON.parse(bodyLogs.find(l => l.aiAnalysis).aiAnalysis) : null;
      const userGoal = profile?.goal_type || 'maintain';
      
      const context = profile ? `
Contexto del Usuario:
- Peso: ${profile.weight_kg || bodyLogs[0]?.weight || '--'}kg
- Objetivo Principal: ${userGoal === 'lose' ? 'Perder Grasa / Déficit' : userGoal === 'gain' ? 'Ganar Masa / Hipertrofia' : 'Mantenimiento'}
- Análisis IA Corporal: ${recentAnalysis?.recomendacion_entrenamiento || 'No disponible'}
- Áreas de interés: ${userGoal === 'lose' ? 'Priorizar piernas, cardio y abdomen para maximizar gasto calórico' : 'Priorizar hombros, espalda y brazos para estética V-taper'}
` : '';

      const prompt = `Actúa como un ENTRENADOR_IA_ROBOTICO.
Genera una rutina basada en: "${aiPrompt}".${context}

REGLAS_ESTRICTAS:
1. OBJETIVO_PERDIDA_GRASA: Prioriza Piernas, Cardio, Abdomen (Gasto calórico alto).
2. OBJETIVO_GANAR_MASA: Prioriza Hipertrofia (Rangos 8-12 reps, Foco en hombros/espalda).
3. ESTRUCTURA: Mínimo 6 ejercicios por rutina.
4. FORMATO: Solo JSON. Sin markdown, sin comentarios, sin explicaciones.
5. MUSCLE_GROUPS_VALIDOS: "chest", "back", "legs", "shoulders", "arms", "abs", "cardio".

JSON_SCHEMA:
{
  "name": "string",
  "description": "string",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "exercises": [
    { "name": "string", "sets": number, "reps": "string", "rest": "string", "muscleGroup": "string", "notes": "string" }
  ]
}

Si es plan semanal, devuelve un ARRAY [{},{},...] de lo contrario un solo OBJETO {}.`
      
      const response = await generateGroqResponse(prompt)
      console.log("AI Raw Response Length:", response.length);
      
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response:", response);
        throw new Error("No se encontró JSON");
      }
      
      // DEEP CLEANING
      let jsonStr = jsonMatch[0]
        .replace(/\/\/.*$/gm, '')           
        .replace(/\/\*[\s\S]*?\*\//g, '')   
        .replace(/,\s*([\]}])/g, '$1')      
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") 
        .trim();

      console.log("Cleaned JSON Length:", jsonStr.length);
      const data = JSON.parse(jsonStr)
      
      if (Array.isArray(data)) {
        for (const w of data) await addWorkout(w)
      } else {
        await addWorkout(data)
      }
      
      setShowAiForm(false)
      setAiPrompt('')
    } catch (error) {
      console.error("AI Error:", error)
      alert("Error al generar rutina. Intenta ser más específico.")
    } finally {
      setIsGenerating(false)
    }
  }

  const startWorkout = async (w) => {
    setActiveWorkout(w)
    // Check if there's already an in-progress log
    const existingLog = todayLogs.find(l => l.workoutId === w._id)
    if (!existingLog) {
      const logId = await logWorkout({
        workoutId: w._id,
        date: todayStr,
        status: 'in_progress',
        completedExercises: []
      })
      // The useEffect will pick up the log
    } else {
      setActiveLog(existingLog)
      setCompletedExercises(existingLog.completedExercises || [])
    }
  }

  const toggleExercise = async (idx) => {
    let newCompleted = []
    if (completedExercises.includes(idx)) {
      newCompleted = completedExercises.filter(i => i !== idx)
    } else {
      newCompleted = [...completedExercises, idx]
    }
    setCompletedExercises(newCompleted)
    
    if (activeLog) {
      await updateLogProgress({
        logId: activeLog._id,
        completedExercises: newCompleted
      })
    }
  }

  const finishWorkout = async () => {
    if (activeLog) {
      await logWorkout({
        workoutId: activeWorkout._id,
        date: todayStr,
        status: 'completed',
        duration: 45,
        performance: 'good',
        completedExercises: completedExercises
      })
    }
    setActiveWorkout(null)
    setActiveLog(null)
    setCompletedExercises([])
  }

  const addExercise = () => setForm({ ...form, exercises: [...form.exercises, { name: '', sets: 3, reps: '10', rest: '60s', muscleGroup: 'chest' }] })
  const updateExercise = (i, field, val) => {
    const ex = [...form.exercises]
    ex[i][field] = val
    setForm({ ...form, exercises: ex })
  }
  const removeExercise = (i) => setForm({ ...form, exercises: form.exercises.filter((_, idx) => idx !== i) })

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            Entrenamiento
          </h1>
          <p className="text-white/60 mt-1 text-sm md:text-base">Planificador inteligente de alto rendimiento.</p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={() => setShowAiForm(true)} className="flex-1 lg:flex-none btn-accent py-3 px-4 md:px-6 shadow-brand-500/20 text-[10px] md:text-xs">
            <Sparkles size={16} /> VITALIS AI
          </button>
          <button onClick={() => setShowForm(true)} className="flex-1 lg:flex-none btn-primary py-3 px-4 md:px-6 text-[10px] md:text-xs">
            <Plus size={16} /> Manual
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar">
        {['library', 'logs', 'weekly'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`pb-2 px-2 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-brand-400' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab === 'library' ? 'Biblioteca' : tab === 'logs' ? 'Registros' : 'Plan Semanal'}
            {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-brand-500" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'library' ? (
          <motion.div key="library" variants={itemVars} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                <Dumbbell className="mx-auto text-white/20 mb-4" size={40} />
                <p className="text-white/60 mb-2 text-sm">Sin rutinas. Deja que la IA cree una por ti.</p>
              </div>
            ) : (
              workouts.map(w => {
                const log = todayLogs.find(l => l.workoutId === w._id)
                const isCompleted = log?.status === 'completed'
                const isInProgress = log?.status === 'in_progress'
                
                return (
                  <motion.div key={w._id} variants={itemVars} className="glass-card flex flex-col justify-between group relative overflow-hidden !p-5 md:!p-8">
                    {isInProgress && <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 animate-pulse" />}
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-black text-white">{w.name}</h3>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${w.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : w.difficulty === 'advanced' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {w.difficulty}
                        </span>
                      </div>
                      <div className="space-y-2 mb-6">
                        {w.exercises.slice(0, 4).map((ex, i) => (
                          <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                              {MUSCLE_ICONS[ex.muscleGroup] || MUSCLE_ICONS.default}
                              <span className="text-white/80 font-medium">{ex.name}</span>
                            </div>
                            <span className="text-white/40 text-xs">{ex.sets}x{ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => startWorkout(w)} 
                        className={`flex-1 py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${isCompleted ? 'bg-green-500/10 text-green-400 border border-green-500/30' : isInProgress ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
                      >
                        {isCompleted ? <><CheckCircle size={16} /> Completado</> : isInProgress ? <><Activity size={16} className="animate-pulse" /> Reanudar</> : <><ChevronRight size={16} /> Ver Rutina</>}
                      </button>
                      <button onClick={() => deleteWorkout({ id: w._id })} className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 rounded-xl transition-colors"><X size={16} /></button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        ) : activeTab === 'logs' ? (
          <motion.div key="logs" variants={itemVars} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {todayLogs.length === 0 ? (
               <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                 <Clock className="mx-auto text-white/20 mb-4" size={48} />
                 <p className="text-white/60">No hay actividad hoy.</p>
               </div>
            ) : (
              todayLogs.map(log => {
                const w = workouts.find(wo => wo._id === log.workoutId)
                return (
                  <motion.div key={log._id} className="glass-card flex items-center justify-between !p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-brand-500/20 text-brand-400'}`}>
                        {log.status === 'completed' ? <CheckCircle size={24} /> : <Activity size={24} className="animate-pulse" />}
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{w ? w.name : 'Rutina eliminada'}</h4>
                        <p className="text-white/40 text-xs mt-0.5">{log.status === 'completed' ? `Completado • ${log.duration} min` : 'En progreso...'}</p>
                      </div>
                    </div>
                    <button onClick={() => { if(w) startWorkout(w) }} className="text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:underline">Ver detalles</button>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        ) : (
          <motion.div key="weekly" variants={itemVars} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                const dayWorkouts = workouts.filter(w => w.name.toLowerCase().includes(day.toLowerCase()) || (w.description && w.description.toLowerCase().includes(day.toLowerCase())))
                return (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 text-center">{day}</div>
                    <div className="flex-1 min-h-[150px] bg-white/5 border border-white/5 rounded-2xl p-2 flex flex-col gap-2">
                      {dayWorkouts.length === 0 ? <div className="flex-1 flex items-center justify-center text-[10px] text-white/10 font-bold uppercase italic text-center p-2">Descanso</div> : dayWorkouts.map(w => (
                        <div key={w._id} onClick={() => startWorkout(w)} className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl cursor-pointer hover:bg-brand-500/20 transition-all">
                          <div className="text-[10px] font-bold text-white truncate">{w.name.split(':')[1] || w.name}</div>
                          <div className="text-[8px] text-brand-400 font-black uppercase mt-1">{w.exercises.length} Ejercicios</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-900 border border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2"><Dumbbell className="text-brand-400"/> Crear Rutina</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white p-2 bg-white/5 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddManual} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">Nombre</label>
                  <input required className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej. Pierna Pesado" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">Dificultad</label>
                  <select className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white appearance-none" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                    <option value="beginner">Básico</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50">Ejercicios</label>
                  <button type="button" onClick={addExercise} className="text-brand-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-brand-300"><Plus size={14} /> Añadir</button>
                </div>
                
                <div className="space-y-3">
                  {form.exercises.map((ex, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex gap-2">
                        <input required className="flex-1 bg-transparent border-b border-white/10 outline-none text-white text-sm pb-1" placeholder="Nombre Ejercicio" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} />
                        <select className="bg-dark-950 text-[10px] p-1 rounded outline-none text-white/60" value={ex.muscleGroup} onChange={e => updateExercise(i, 'muscleGroup', e.target.value)}>
                          {Object.keys(MUSCLE_ICONS).map(m => m !== 'default' && <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                        <button type="button" onClick={() => removeExercise(i)} className="text-white/30 hover:text-red-400"><X size={16}/></button>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Sets</span>
                          <input type="number" className="w-full bg-dark-950 p-2 rounded-lg outline-none text-white text-center text-sm" value={ex.sets} onChange={e => updateExercise(i, 'sets', Number(e.target.value))} />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Reps</span>
                          <input className="w-full bg-dark-950 p-2 rounded-lg outline-none text-white text-center text-sm" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-4 uppercase tracking-widest font-black text-sm">Guardar Rutina</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* AI Form Modal */}
      {showAiForm && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-dark-900 to-dark-950 border border-brand-500/20 rounded-3xl p-8 w-full max-w-lg relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3"><Brain className="text-brand-400" size={32} /> VITALIS AI</h2>
                <p className="text-white/50 text-sm mt-2">Describe tus objetivos. Consideraremos tu biometría y escaneos corporales.</p>
              </div>
              <button onClick={() => setShowAiForm(false)} className="text-white/40 hover:text-white p-2 bg-white/5 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleGenerateAI} className="space-y-6">
              <textarea required rows={4} className="w-full p-4 bg-dark-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white resize-none" placeholder="Ej. Quiero una rutina de hipertrofia de 4 días enfocada en hombros y espalda. Tengo poco tiempo." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
              <button type="submit" disabled={isGenerating || !aiPrompt} className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</> : <><Sparkles size={18} /> Crear Rutina Pro <ArrowRight size={18}/></>}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Active Workout Player */}
      {activeWorkout && (
        <div className="fixed inset-0 bg-dark-950/95 backdrop-blur-xl flex flex-col z-[60]">
          <div className="flex-1 overflow-y-auto pb-32">
            <div className="max-w-2xl mx-auto p-6">
              <div className="flex justify-between items-start mb-8 mt-4">
                <div>
                  <span className="text-brand-400 font-bold uppercase tracking-widest text-[10px] bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20 mb-3 inline-block">Sustancia en curso</span>
                  <h2 className="text-3xl font-black text-white tracking-tighter">{activeWorkout.name}</h2>
                  <p className="text-white/50 mt-1">{activeWorkout.description}</p>
                </div>
                <button onClick={() => setActiveWorkout(null)} className="p-3 bg-white/5 rounded-full text-white/50 hover:text-white"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                {activeWorkout.exercises.map((ex, idx) => {
                  const isDone = completedExercises.includes(idx)
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all ${isDone ? 'bg-brand-500/10 border-brand-500/30 opacity-60' : 'bg-dark-900 border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleExercise(idx)} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-brand-500 border-brand-500 text-white' : 'border-white/20 text-transparent hover:border-brand-500'}`}>
                          <CheckCircle size={20} />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {MUSCLE_ICONS[ex.muscleGroup] || MUSCLE_ICONS.default}
                            <h4 className={`font-bold text-lg ${isDone ? 'text-white/50 line-through' : 'text-white'}`}>{ex.name}</h4>
                          </div>
                          <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                            <span>{ex.sets} Sets</span>
                            <span>•</span>
                            <span>{ex.reps} Reps</span>
                            {ex.rest && <span>• Descanso: {ex.rest}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-950 via-dark-950 to-transparent">
            <div className="max-w-2xl mx-auto flex gap-4 items-center bg-dark-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/5">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">Tu Progreso</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-brand-500" initial={{width:0}} animate={{ width: `${(completedExercises.length / activeWorkout.exercises.length) * 100}%` }} />
                </div>
              </div>
              <button 
                onClick={finishWorkout}
                className="btn-primary py-4 px-8 uppercase tracking-widest font-black text-sm"
              >
                {completedExercises.length === activeWorkout.exercises.length ? 'Finalizar' : 'Guardar y Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
