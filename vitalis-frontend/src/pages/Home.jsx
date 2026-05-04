import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, Target, TrendingUp, Settings, Plus, Beef, Wheat, Droplets, Sparkles, Calendar, Pill, Dumbbell, CheckCircle } from 'lucide-react'
import { bmi, recommendedCalories, classificationByTarget } from '../utils/nutrition'
import { getDailyTip } from '../services/groqAI'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts'
import WaterTracker from '../components/WaterTracker'

function bmiCategory(imc) {
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

function ProgressRing({ radius, stroke, progress, target, total }) {
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference
  let color = '#6366f1' // brand-500
  if (progress > 120) color = '#ef4444'
  else if (progress > 100) color = '#f59e0b'

  return (
    <div className="relative flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90 transform">
        <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black text-white tracking-tighter">{total}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">{target || '--'} kcal</span>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const profile = useQuery(api.profile.get)
  const items = useQuery(api.meals.getToday) || []
  const weekData = useQuery(api.dailyLogs.getWeekSummary) || []
  const stats = useQuery(api.dailyLogs.getStats)
  const saveProfileMutation = useMutation(api.profile.update)

  const todayStr = new Date().toISOString().split('T')[0]
  const todayWorkoutLogs = useQuery(api.workouts?.getLogs ?? null, { date: todayStr }) || []

  const [editingProfile, setEditingProfile] = useState(false)
  const [localProfile, setLocalProfile] = useState(null)

  useEffect(() => { if (profile) setLocalProfile(profile) }, [profile])

  const total = items.reduce((s, i) => s + Number(i.calories || 0), 0)
  const totalProtein = items.reduce((s, i) => s + Number(i.protein || 0), 0)
  const totalCarbs = items.reduce((s, i) => s + Number(i.carbs || 0), 0)
  const totalFat = items.reduce((s, i) => s + Number(i.fat || 0), 0)

  const weightKg = profile?.weight_kg ?? profile?.weightKg ?? null
  const heightCm = profile?.height_cm ?? profile?.heightCm ?? null
  const imc = profile ? bmi(weightKg, heightCm) : null
  const target = profile ? recommendedCalories({ 
    sex_assigned: profile.sex_assigned || 'male', 
    weight_kg: weightKg || 70, 
    height_cm: heightCm || 170, 
    age: profile.age || 30, 
    activity_level: profile.activity_level || 'moderate',
    goal_type: profile.goal_type || 'maintain'
  }) : 2000
  const progressRaw = (total / target) * 100
  const displayProgress = Math.min(Math.max(progressRaw, 0), 200)

  // Macro targets (rough estimates)
  const proteinTarget = weightKg ? Math.round(weightKg * 1.6) : null
  const macroData = (totalProtein || totalCarbs || totalFat) ? [
    { name: 'Proteína', value: totalProtein, color: '#ef4444' },
    { name: 'Carbos', value: totalCarbs, color: '#f59e0b' },
    { name: 'Grasa', value: totalFat, color: '#8b5cf6' },
  ].filter(d => d.value > 0) : []

  const chartData = weekData.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short' }),
  }))

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      await saveProfileMutation({
        age: localProfile?.age ?? null,
        weight_kg: localProfile?.weightKg ?? localProfile?.weight_kg ?? null,
        height_cm: localProfile?.heightCm ?? localProfile?.height_cm ?? null,
        sex_assigned: localProfile?.sex ?? localProfile?.sex_assigned ?? null,
        activity_level: localProfile?.activity ?? localProfile?.activity_level ?? null,
        goal_type: localProfile?.goal_type ?? null,
      })
      setEditingProfile(false)
    } catch (err) { console.error(err); alert('Error al guardar') }
  }

  if (profile === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 md:space-y-8 max-w-6xl mx-auto py-6 md:py-10 px-0 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Dashboard</h1>
          <p className="text-white/50 mt-1 text-sm">Tu centro de mando para nutrición y entrenamiento.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => navigate('/workouts')} className="flex-1 md:flex-none btn-accent py-3 px-4 text-xs md:text-sm">
            <Dumbbell size={16} /> Entrenar
          </button>
          <button onClick={() => navigate('/calories')} className="flex-1 md:flex-none btn-primary py-3 px-4 text-xs md:text-sm">
            <Plus size={16} /> Comida
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
        <div className="bg-dark-900/40 backdrop-blur-xl border border-brand-500/20 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-1 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-500/10 blur-2xl rounded-full" />
          <div className="text-2xl md:text-3xl font-black text-white group-hover:scale-110 transition-transform relative z-10">{stats?.streak || 0} 🔥</div>
          <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-white/40 relative z-10">Racha de días</div>
        </div>
        <div className="bg-dark-900/40 backdrop-blur-xl border border-brand-400/20 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-1 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-400/10 blur-2xl rounded-full" />
          <div className="text-2xl md:text-3xl font-black text-brand-400 group-hover:scale-110 transition-transform relative z-10">{items.length}</div>
          <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-white/40 relative z-10">Registros hoy</div>
        </div>
        <div className="bg-dark-900/40 backdrop-blur-xl border border-accent-400/20 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-1 group cursor-pointer relative overflow-hidden" onClick={() => navigate('/supplements')}>
          <div className="absolute -right-4 -top-4 w-12 h-12 bg-accent-400/10 blur-2xl rounded-full" />
          <div className="text-2xl md:text-3xl font-black text-accent-400 group-hover:scale-110 transition-transform relative z-10"><Pill size={20} /></div>
          <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-white/40 relative z-10">Suplementos</div>
        </div>
        <div className="bg-dark-900/40 backdrop-blur-xl border border-indigo-400/20 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-1 group cursor-pointer relative overflow-hidden" onClick={() => navigate('/ai')}>
          <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-400/10 blur-2xl rounded-full" />
          <div className="text-2xl md:text-3xl font-black text-indigo-400 group-hover:scale-110 transition-transform relative z-10"><Sparkles size={20} /></div>
          <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-white/40 relative z-10">VITALIS IA</div>
        </div>
      </motion.div>

      {/* Tip del día */}
      <motion.div variants={itemVars} className="mx-4 md:mx-0 bg-brand-500/10 border border-brand-500/20 rounded-3xl p-4 md:p-5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
          <Sparkles size={16} />
        </div>
        <p className="text-xs text-white/40 italic font-medium leading-tight">"{getDailyTip()}"</p>
      </motion.div>

      {/* Water Tracking */}
      <motion.div variants={itemVars} className="px-4 md:px-0">
        <WaterTracker />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 px-4 md:px-0">
        {/* Profile & Training Summary */}
        <motion.div variants={itemVars} className="lg:col-span-4 space-y-6">
          <div className="glass-card !p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[10px] md:text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2">
                <Target className="text-brand-400" size={14} /> Biometría
              </h2>
              <button onClick={() => { if (!localProfile) setLocalProfile({}); setEditingProfile(true) }} className="p-2 text-white/60 hover:text-white transition-colors">
                <Settings size={16} />
              </button>
            </div>
            {profile ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/60 uppercase">Peso / Altura</span>
                  <span className="text-xs md:text-sm font-black text-white">{weightKg ?? '--'} kg / {heightCm ?? '--'} cm</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/60 uppercase">Objetivo</span>
                  <span className="text-xs md:text-sm font-black text-brand-400">
                    {profile.goal_type === 'lose' ? 'Déficit' : profile.goal_type === 'gain' ? 'Superávit' : 'Mantenimiento'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/60 uppercase">IMC</span>
                  <div className="text-right">
                    <span className="text-xs md:text-sm font-black text-white">{imc ?? '--'}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-brand-400 block uppercase tracking-tighter">{imc ? bmiCategory(imc) : ''}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="mx-auto text-white/80 mb-3" size={28} />
                <p className="text-[10px] text-white/60 mb-4">Configura tu perfil para optimizar la IA.</p>
                <button className="btn-secondary w-full text-[10px] py-2.5" onClick={() => { setLocalProfile({}); setEditingProfile(true) }}>Configurar Ahora</button>
              </div>
            )}
          </div>

          {/* Training Summary */}
          <div className="glass-card bg-gradient-to-br from-dark-900/40 to-accent-500/5 border-accent-500/10 !p-6">
            <h2 className="text-[10px] md:text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-6">
              <Dumbbell className="text-accent-400" size={14} /> Entrenamiento
            </h2>
            {todayWorkoutLogs.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-xs text-white/50 mb-4">No has registrado entrenamiento hoy.</p>
                <button onClick={() => navigate('/workouts')} className="w-full py-3 rounded-2xl border border-accent-500/20 text-accent-400 text-[10px] font-black uppercase tracking-widest hover:bg-accent-500/10 transition-all">
                  Generar Rutina IA
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayWorkoutLogs.map(log => (
                  <div key={log._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center">
                        <CheckCircle size={14} />
                      </div>
                      <div className="text-xs font-bold text-white">Completado</div>
                    </div>
                    <div className="text-[10px] font-black text-accent-400 uppercase tracking-widest">{log.duration ? `${log.duration} min` : 'Listo'}</div>
                  </div>
                ))}
                <button onClick={() => navigate('/workouts')} className="w-full py-2.5 rounded-xl border border-white/5 text-white/50 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all mt-2">
                  Ver Detalles
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress + Macros */}
        <motion.div variants={itemVars} className="lg:col-span-8 glass-card bg-gradient-to-br from-brand-500/5 to-transparent !p-6 md:!p-10">
          <h2 className="text-[10px] md:text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-8">
            <Flame className="text-orange-400" size={14} /> Balance Energético
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 justify-around">
            <div className="scale-75 md:scale-100">
              <ProgressRing radius={90} stroke={14} progress={displayProgress} total={total} target={target} />
            </div>

            <div className="space-y-6 w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                  <span className="block text-[8px] md:text-[10px] uppercase tracking-widest font-bold text-white/60 mb-1">Meta</span>
                  <span className="text-lg md:text-xl font-black text-white">{target ?? '--'}</span>
                </div>
                <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                  <span className="block text-[8px] md:text-[10px] uppercase tracking-widest font-bold text-white/60 mb-1">Restante</span>
                  <span className={`text-lg md:text-xl font-black ${target && total > target ? 'text-red-400' : 'text-brand-400'}`}>{target ? target - total : '--'}</span>
                </div>
              </div>

              {/* Macro bars */}
              <div className="space-y-4">
                {[
                  { label: 'Proteína', icon: Beef, color: 'bg-red-500', text: 'text-red-400', value: totalProtein, target: proteinTarget, unit: 'g' },
                  { label: 'Carbohidratos', icon: Wheat, color: 'bg-orange-500', text: 'text-orange-400', value: totalCarbs, unit: 'g' },
                  { label: 'Grasas', icon: Droplets, color: 'bg-violet-500', text: 'text-violet-400', value: totalFat, unit: 'g' },
                ].map((macro, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[8px] md:text-[10px] uppercase tracking-widest font-bold mb-2">
                      <span className={`${macro.text} flex items-center gap-1.5`}><macro.icon size={10} /> {macro.label}</span>
                      <span className="text-white/50">{macro.value}{macro.unit} {macro.target ? `/ ${macro.target}${macro.unit}` : ''}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${macro.target ? Math.min((macro.value / macro.target) * 100, 100) : (target ? Math.min((macro.value * (i === 2 ? 9 : 4) / target) * 100 * 2, 100) : 0)}%` }}
                        className={`h-full ${macro.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
                        transition={{ duration: 1.5, ease: "circOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly chart + Macro pie */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <motion.div variants={itemVars} className="glass-card md:col-span-8">
          <h2 className="text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-6">
            <TrendingUp className="text-brand-400" size={16} /> Tendencia Semanal
          </h2>
          {chartData.length > 0 && chartData.some(d => d.totalCalories > 0) ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="calGradHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="totalCalories" stroke="#6366f1" fill="url(#calGradHome)" strokeWidth={3} dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#0f172a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-white/60 text-xs">
              <Calendar className="mx-auto mb-2 text-white/90" size={32} />
              Archiva días para ver tu tendencia de rendimiento.
            </div>
          )}
        </motion.div>

        {/* Macro Pie Chart */}
        <motion.div variants={itemVars} className="glass-card md:col-span-4 flex flex-col items-center justify-center">
          <h2 className="text-sm uppercase tracking-widest font-black text-white/60 mb-6">Distribución</h2>
          {macroData.length > 0 ? (
            <>
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: 'none' }} formatter={(v, n) => [`${v}g`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                {macroData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-white/50">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[10px] text-white/60 uppercase tracking-widest text-center">Sin datos de macros hoy</p>
          )}
        </motion.div>
      </div>

      {/* Meal Breakdown */}
      <motion.div variants={itemVars} className="glass-card">
        <h2 className="text-sm uppercase tracking-widest font-black text-white/60 flex items-center gap-2 mb-8">
          <Activity className="text-brand-400" size={16} /> Registro Detallado
        </h2>
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/60 text-sm mb-4 italic">No hay registros de nutrición para hoy.</p>
            <button onClick={() => navigate('/calories')} className="btn-secondary text-xs uppercase tracking-widest font-black py-3 px-8">Comenzar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it, idx) => {
              const pct = target ? Math.round((it.calories / target) * 100) : 0
              return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={it._id} className="bg-white/5 p-5 rounded-2xl border border-white/5 group hover:border-brand-500/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold text-white tracking-tight">{it.name}</div>
                    <div className="text-xs font-black bg-brand-500/10 text-brand-400 px-3 py-1.5 rounded-full border border-brand-500/20">
                      {it.calories} kcal
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${pct > 40 ? 'bg-accent-500' : 'bg-brand-500'}`} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-900 border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-6">Biometría</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Edad</label>
                  <input className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="28" type="number" value={localProfile?.age ?? ''} onChange={e => setLocalProfile(p => ({ ...(p || {}), age: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Peso (kg)</label>
                  <input className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="70" type="number" value={localProfile?.weightKg ?? localProfile?.weight_kg ?? ''} onChange={e => setLocalProfile(p => ({ ...(p || {}), weightKg: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Altura (cm)</label>
                <input className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white" placeholder="175" type="number" value={localProfile?.heightCm ?? localProfile?.height_cm ?? ''} onChange={e => setLocalProfile(p => ({ ...(p || {}), heightCm: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Sexo Asignado</label>
                <select value={localProfile?.sex ?? localProfile?.sex_assigned ?? ''} onChange={e => setLocalProfile(p => ({ ...(p || {}), sex: e.target.value }))} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white">
                  <option value="" className="bg-dark-900">Selecciona</option>
                  <option value="male" className="bg-dark-900">Masculino</option>
                  <option value="female" className="bg-dark-900">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Nivel de Actividad</label>
                <select value={localProfile?.activity ?? localProfile?.activity_level ?? ''} onChange={e => setLocalProfile(p => ({ ...(p || {}), activity: e.target.value }))} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-white">
                  <option value="" className="bg-dark-900">Selecciona</option>
                  <option value="sedentary" className="bg-dark-900">Sedentario</option>
                  <option value="light" className="bg-dark-900">Ligera</option>
                  <option value="moderate" className="bg-dark-900">Moderada</option>
                  <option value="active" className="bg-dark-900">Activa</option>
                  <option value="very" className="bg-dark-900">Muy activa</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">Objetivo (Calorías)</label>
                <select value={localProfile?.goal_type || 'maintain'} onChange={e => setLocalProfile(p => ({ ...(p || {}), goal_type: e.target.value }))} className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-brand-400 font-bold">
                  <option value="lose" className="bg-dark-900 text-white">Déficit (Perder Grasa)</option>
                  <option value="maintain" className="bg-dark-900 text-white">Mantenimiento</option>
                  <option value="gain" className="bg-dark-900 text-white">Superávit (Ganar Masa)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 btn-primary py-3.5 uppercase tracking-widest font-black text-xs">Guardar Cambios</button>
                <button type="button" onClick={() => setEditingProfile(false)} className="px-6 py-3.5 font-bold text-white/50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs">Cerrar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
