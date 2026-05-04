import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, TrendingUp, Sparkles, Scale, Activity, Plus, Loader2, Upload, ScanFace, X, Check } from 'lucide-react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { analyzeBodyProgress, analyzeBodyPhoto } from '../services/groqAI'
import { AreaChart, Area, XAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function BodyTracking() {
  const profile = useQuery(api.profile.get)
  const logs = useQuery(api.bodyLogs.getLogs) || []
  const addLog = useMutation(api.bodyLogs.addLog)

  const [showSimModal, setShowSimModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [simPrompt, setSimPrompt] = useState('')
  const [simResult, setSimResult] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  
  const [photoImage, setPhotoImage] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)
  
  const [expandedLog, setExpandedLog] = useState(null)

  const [form, setForm] = useState({ weight: '', bodyFat: '', notes: '' })

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  const chartData = [...logs].reverse().map(l => ({
    date: new Date(l.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    weight: l.weight
  })).filter(l => l.weight)

  async function handleSimulate(e) {
    e.preventDefault()
    if (!simPrompt) return
    setIsSimulating(true)
    try {
      const w = profile?.weight_kg || logs[0]?.weight || 70
      const res = await analyzeBodyProgress(w, simPrompt)
      setSimResult(res)
    } catch (err) {
      alert("Error al simular.")
    } finally {
      setIsSimulating(false)
    }
  }

  async function handleAddLog(e) {
    e.preventDefault()
    await addLog({
      date: new Date().toISOString().split('T')[0],
      weight: form.weight ? Number(form.weight) : undefined,
      bodyFatPercentage: form.bodyFat ? Number(form.bodyFat) : undefined,
      description: form.notes
    })
    setShowLogModal(false)
    setForm({ weight: '', bodyFat: '', notes: '' })
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            Físico y Progreso
          </h1>
          <p className="text-white/60 mt-1 text-sm md:text-base">Sigue tu evolución, registra tu peso y simula tus resultados.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 w-full lg:w-auto">
          <button onClick={() => setShowPhotoModal(true)} className="col-span-2 md:flex-none btn-accent py-3 px-4 md:px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/20 text-[10px] md:text-xs">
            <ScanFace size={16} /> Escáner Corporal
          </button>
          <button onClick={() => setShowSimModal(true)} className="btn-accent py-3 px-4 md:px-6 text-[10px] md:text-xs">
            <Sparkles size={16} /> Simulador IA
          </button>
          <button onClick={() => setShowLogModal(true)} className="btn-primary py-3 px-4 md:px-6 text-[10px] md:text-xs">
            <Plus size={16} /> Registrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <motion.div variants={itemVars} className="md:col-span-2 lg:col-span-2 glass-card !p-4 md:!p-8">
          <h2 className="text-[10px] md:text-xs uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-6">
            <TrendingUp className="text-brand-400" size={14} /> Evolución de Peso
          </h2>
          {chartData.length > 1 ? (
            <div className="h-48 md:h-64 -ml-4 md:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#020a08', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} />
                  <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" dot={{fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#020a08'}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 md:h-64 flex flex-col items-center justify-center text-white/40 border border-white/5 border-dashed rounded-3xl">
              <Scale size={40} className="mb-4 opacity-50" />
              <p className="text-xs text-center px-4">Registra tu peso en diferentes días para ver la gráfica.</p>
            </div>
          )}
        </motion.div>

        {/* Latest Log */}
        <motion.div variants={itemVars} className="glass-card flex flex-col !p-6">
          <h2 className="text-[10px] md:text-xs uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-6">
            <Activity className="text-brand-400" size={14} /> Estado Actual
          </h2>
          
          <div className="flex-1 flex flex-row md:flex-col justify-center items-center gap-4 md:gap-6">
            <div className="flex-1 w-full bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 text-center">
              <p className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Peso</p>
              <div className="text-2xl md:text-4xl font-black text-white">
                {logs[0]?.weight ? `${logs[0].weight}` : profile?.weight_kg ? `${profile.weight_kg}` : '--'}<span className="text-xs md:text-sm ml-1 text-white/40 font-bold">kg</span>
              </div>
            </div>
            
            <div className="flex-1 w-full bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 text-center">
              <p className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Grasa</p>
              <div className="text-2xl md:text-4xl font-black text-white">
                {logs[0]?.bodyFatPercentage ? `${logs[0].bodyFatPercentage}` : '--'}<span className="text-xs md:text-sm ml-1 text-white/40 font-bold">%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Log History */}
      <motion.div variants={itemVars} className="glass-card">
        <h2 className="text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-6">
          <Camera className="text-brand-400" size={16} /> Historial de Entradas
        </h2>
        <div className="space-y-3">
          {logs.map((log, i) => (
            <div 
              key={log._id} 
              onClick={() => setExpandedLog(log)}
              className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div>
                <p className="text-white font-bold">{new Date(log.date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {log.description && <p className="text-white/50 text-sm italic mt-1">"{log.description}"</p>}
                {log.aiAnalysis && <span className="inline-block mt-2 text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-bold">Con Foto/IA</span>}
              </div>
              <div className="text-right">
                {log.weight && <p className="text-brand-400 font-black">{log.weight} kg</p>}
                {log.bodyFatPercentage && <p className="text-white/40 text-xs font-bold">{log.bodyFatPercentage}% grasa</p>}
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-white/40 text-center py-6">No hay registros aún.</p>}
        </div>
      </motion.div>

      {/* Sim Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-dark-900 to-dark-950 border border-brand-500/20 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.1)] p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2"><Sparkles className="text-brand-400"/> Simulador IA de Progreso</h2>
            <p className="text-white/50 text-sm mb-6">Dime qué estás haciendo (ej: "estoy comiendo 1500 kcal y entrenando 3 veces a la semana") y proyectaré tus resultados.</p>
            
            <textarea 
              rows={3}
              value={simPrompt}
              onChange={e => setSimPrompt(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white mb-4"
              placeholder="Ej: Empecé a correr 5km diarios y levanté mi peso en press de banca. Peso 80kg ahora."
            />
            
            {simResult && (
              <div className="mb-6 p-5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-50">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{simResult}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSimulate} disabled={isSimulating || !simPrompt} className="flex-1 btn-primary py-3 flex justify-center items-center gap-2 disabled:opacity-50">
                {isSimulating ? <Loader2 className="animate-spin" size={18} /> : 'Simular Futuro'}
              </button>
              <button onClick={() => { setShowSimModal(false); setSimResult('') }} className="px-6 py-3 font-bold text-white/50 bg-white/5 rounded-xl hover:bg-white/10">Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm">
            <h2 className="text-xl font-black text-white mb-6">Nuevo Registro</h2>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">Peso (kg)</label>
                <input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="Ej. 75.5" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">% Grasa Corporal (Opcional)</label>
                <input type="number" step="0.1" value={form.bodyFat} onChange={e => setForm({...form, bodyFat: e.target.value})} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="Ej. 18.5" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">Notas (Fuerza, logros, fotos)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="Hoy levanté 5kg más en banca..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn-primary py-3">Guardar</button>
                <button type="button" onClick={() => setShowLogModal(false)} className="px-5 py-3 font-bold text-white/50 bg-white/5 rounded-xl hover:bg-white/10">Cancelar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Escáner Corporal Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><ScanFace className="text-violet-400"/> Análisis Físico IA</h2>
              <button onClick={() => { setShowPhotoModal(false); setPhotoResult(null); setPhotoPreview(null) }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            {!photoPreview ? (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center relative cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group">
                <Upload className="mx-auto text-white/50 group-hover:text-violet-400 mb-3" size={40} />
                <p className="text-white/60 font-bold mb-1">Sube una foto de tu físico</p>
                <p className="text-xs text-white/40">Frente al espejo, buena luz. Tu privacidad es 100% segura.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = ev => {
                        const img = new Image()
                        img.onload = () => {
                          const canvas = document.createElement('canvas')
                          const MAX_WIDTH = 800
                          const MAX_HEIGHT = 800
                          let width = img.width
                          let height = img.height

                          if (width > height) {
                            if (width > MAX_WIDTH) {
                              height *= MAX_WIDTH / width
                              width = MAX_WIDTH
                            }
                          } else {
                            if (height > MAX_HEIGHT) {
                              width *= MAX_HEIGHT / height
                              height = MAX_HEIGHT
                            }
                          }

                          canvas.width = width
                          canvas.height = height
                          const ctx = canvas.getContext('2d')
                          ctx.drawImage(img, 0, 0, width, height)
                          
                          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
                          setPhotoPreview(resizedDataUrl)
                          setPhotoImage(resizedDataUrl.split(',')[1])
                        }
                        img.src = ev.target.result
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
            ) : !photoResult ? (
              <div className="space-y-4">
                <img src={photoPreview} className="w-full h-64 object-cover rounded-2xl" alt="Preview" />
                <button 
                  onClick={async () => {
                    setIsAnalyzingPhoto(true)
                    try {
                      const res = await analyzeBodyPhoto(photoImage, { weight: profile?.weight_kg, height: profile?.height_cm })
                      setPhotoResult(res)
                    } catch(e) {
                      alert("Error analizando foto")
                    } finally {
                      setIsAnalyzingPhoto(false)
                    }
                  }}
                  disabled={isAnalyzingPhoto}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzingPhoto ? <><Loader2 className="animate-spin" size={18}/> Analizando Físico...</> : <><Sparkles size={18}/> Extraer Datos Biométricos</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 overflow-hidden shrink-0">
                    <img src={photoPreview} className="w-full h-full object-cover" alt="Thumb" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">Grasa Estimada</p>
                    <p className="text-2xl font-black text-violet-400">{photoResult.estimacion_grasa}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-dark-950 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-400 mb-1">Puntos Fuertes</p>
                    <p className="text-sm text-white/80">{photoResult.puntos_fuertes}</p>
                  </div>
                  <div className="bg-dark-950 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Ajuste de Entrenamiento</p>
                    <p className="text-sm text-white/80">{photoResult.recomendacion_entrenamiento}</p>
                  </div>
                  <div className="bg-dark-950 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">Ajuste Nutricional</p>
                    <p className="text-sm text-white/80">{photoResult.recomendacion_alimentacion}</p>
                  </div>
                  <div className="bg-violet-500/10 p-4 rounded-xl border border-violet-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Meta a 4 Semanas</p>
                    <p className="text-sm font-bold text-white">{photoResult.proximo_hito}</p>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    const matchFat = photoResult.estimacion_grasa.match(/\d+/);
                    const parsedFat = matchFat ? Number(matchFat[0]) : undefined;
                    await addLog({
                      date: new Date().toISOString().split('T')[0],
                      aiAnalysis: JSON.stringify({ ...photoResult, imageBase64: photoPreview }),
                      description: "Análisis Físico IA completado",
                      bodyFatPercentage: parsedFat
                    })
                    setShowPhotoModal(false); setPhotoResult(null); setPhotoPreview(null);
                  }}
                  className="w-full btn-primary py-3.5 mt-2 flex items-center justify-center gap-2"
                >
                  <Check size={18}/> Guardar en mi Progreso
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Expanded Log Detail Modal */}
      {expandedLog && (
        <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-900 border border-white/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">{new Date(expandedLog.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <button onClick={() => setExpandedLog(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-around bg-white/5 p-4 rounded-2xl mb-4">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Peso</p>
                <p className="font-black text-brand-400 text-xl">{expandedLog.weight ? `${expandedLog.weight} kg` : '--'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Grasa</p>
                <p className="font-black text-white text-xl">{expandedLog.bodyFatPercentage ? `${expandedLog.bodyFatPercentage}%` : '--'}</p>
              </div>
            </div>

            {expandedLog.description && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Notas</p>
                <p className="text-sm text-white bg-dark-950 p-4 rounded-xl border border-white/5">"{expandedLog.description}"</p>
              </div>
            )}

            {expandedLog.aiAnalysis && (() => {
              try {
                const analysis = JSON.parse(expandedLog.aiAnalysis)
                return (
                  <div className="space-y-4">
                    {analysis.imageBase64 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Foto de Progreso</p>
                        <img src={analysis.imageBase64} className="w-full rounded-2xl border border-white/10" alt="Progreso" />
                      </div>
                    )}
                    {analysis.puntos_fuertes && (
                      <div className="bg-violet-500/10 p-4 rounded-xl border border-violet-500/20 mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2 flex items-center gap-1"><ScanFace size={12}/> Análisis IA Guardado</p>
                        <ul className="text-sm text-white/80 space-y-2">
                          <li><strong className="text-white">Puntos Fuertes:</strong> {analysis.puntos_fuertes}</li>
                          <li><strong className="text-white">Entrenamiento:</strong> {analysis.recomendacion_entrenamiento}</li>
                          <li><strong className="text-white">Nutrición:</strong> {analysis.recomendacion_alimentacion}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )
              } catch (e) {
                return <p className="text-sm text-white/50 italic">{expandedLog.aiAnalysis}</p>
              }
            })()}
          </motion.div>
        </div>
      )}

    </motion.div>
  )
}
