import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, AlertTriangle, Sparkles, Edit2 } from 'lucide-react'
import { analyzeFoodPhoto } from '../services/groqAI'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function FoodScanner({ onResult, onClose, consumedToday = 0 }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [error, setError] = useState(null)
  const fileRef = useRef(null)
  const profile = useQuery(api.profile.get)

  const targetCalories = profile
    ? (() => {
        const w = profile.weight_kg || 70
        const h = profile.height_cm || 170
        const a = profile.age || 25
        const s = profile.sex_assigned || 'male'
        const base = s === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
        const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 }
        return Math.round(base * (factors[profile.activity_level] || 1.2))
      })()
    : 2000

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResult(null)
    setCorrectionText('')

    const reader = new FileReader()
    reader.onload = (ev) => {
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
        setPreview(resizedDataUrl)
        setCorrectionText('')
        setImage(resizedDataUrl.split(',')[1])
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function analyze(isCorrection = false) {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    try {
      const res = await analyzeFoodPhoto(
        image, 
        { targetCalories, consumedToday }, 
        isCorrection ? correctionText : null
      )
      setResult(res)
      if (isCorrection) setCorrectionText('')
    } catch (err) {
      console.error(err)
      setError('Error al analizar la imagen. Verifica tu API key de Groq o intenta con otra foto.')
    } finally {
      setAnalyzing(false)
    }
  }

  const remaining = targetCalories - consumedToday
  const wouldExceed = result ? (consumedToday + (result.calorias || 0)) > targetCalories : false

  const handleEditChange = (field, value) => {
    setResult(prev => ({ ...prev, [field]: Number(value) }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-dark-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">VITALIS Scanner</h2>
              <p className="text-xs text-white/50">Análisis nutricional con Visión IA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white bg-white/5 rounded-full p-2 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Context bar */}
          <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 text-sm">
            <span className="text-white/50">Presupuesto restante</span>
            <span className={`font-bold ${remaining > 0 ? 'text-brand-400' : 'text-red-400'}`}>
              {remaining} kcal
            </span>
          </div>

          {/* Upload Area */}
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
            >
              <Upload className="mx-auto text-white/70 group-hover:text-brand-400 mb-3 transition-colors" size={40} />
              <p className="text-white/50 font-medium">Sube una foto de tu comida</p>
              <p className="text-xs text-white/60 mt-1">JPG, PNG — máximo 10MB</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </div>
          ) : (
            <div className="relative">
              <img src={preview} alt="Food preview" className="w-full h-56 object-cover rounded-2xl" />
              <button
                onClick={() => { setPreview(null); setImage(null); setResult(null) }}
                className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Analyze Button */}
          {preview && !result && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="w-full btn-primary py-3.5 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analizar Comida
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              <AlertTriangle className="inline mr-2" size={16} />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">{result.nombre}</h3>
                    <p className="text-sm text-white/50 mt-0.5">{result.descripcion}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {result.saludable !== null && (
                      <span className={`text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full ${result.saludable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {result.saludable ? 'Saludable' : 'Cuidado'}
                      </span>
                    )}
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className={`text-xs flex items-center gap-1 transition-colors ${isEditing ? 'text-brand-400' : 'text-white/60 hover:text-white/40'}`}
                    >
                      <Edit2 size={12} /> {isEditing ? 'Guardar' : 'Editar'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'kcal', key: 'calorias', color: 'text-orange-400' },
                    { label: 'Prot (g)', key: 'proteina', color: 'text-red-400' },
                    { label: 'Carb (g)', key: 'carbohidratos', color: 'text-cyan-400' },
                    { label: 'Fat (g)', key: 'grasa', color: 'text-violet-400' },
                  ].map((macro) => (
                    <div key={macro.key} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={result[macro.key] || 0}
                          onChange={(e) => handleEditChange(macro.key, e.target.value)}
                          className={`w-full bg-transparent text-center font-bold text-lg focus:outline-none ${macro.color}`}
                        />
                      ) : (
                        <div className={`text-lg font-bold ${macro.color}`}>{result[macro.key] || 0}</div>
                      )}
                      <div className="text-[10px] text-white/60 font-medium">{macro.label}</div>
                    </div>
                  ))}
                </div>

                {/* Would exceed warning */}
                {wouldExceed && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 mb-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Límite excedido por {(consumedToday + (result.calorias || 0)) - targetCalories} kcal.</span>
                  </div>
                )}

                <p className="text-sm text-white/40 bg-white/5 p-3 rounded-xl border border-white/5 italic mb-4">
                  "{result.recomendacion}"
                </p>

                {/* AI Correction Loop */}
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-4 mt-2">
                  <p className="text-xs text-white/60 mb-2 font-medium">¿La IA se equivocó de platillo?</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={correctionText}
                      onChange={e => setCorrectionText(e.target.value)}
                      placeholder="No es pollo, son papas guisadas..." 
                      className="flex-1 bg-dark-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                    />
                    <button 
                      onClick={() => analyze(true)}
                      disabled={analyzing || !correctionText}
                      className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Recalcular
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onResult(result)}
                  className="flex-1 btn-primary py-3"
                >
                  <Check size={18} /> Confirmar Registro
                </button>
                <button
                  onClick={() => { setResult(null); setPreview(null); setImage(null); setIsEditing(false); setCorrectionText('') }}
                  className="px-5 py-3 font-medium text-white/50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
