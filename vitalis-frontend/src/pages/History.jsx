import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Flame, Beef, Wheat, Droplets, Clock } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function History() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(null)

  const logs = useQuery(api.dailyLogs.getByMonth, { year, month }) || []
  const weekData = useQuery(api.dailyLogs.getWeekSummary) || []
  const stats = useQuery(api.dailyLogs.getStats)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

  // Map logs by day number
  const logsByDay = {}
  logs.forEach(l => {
    const day = parseInt(l.date.split('-')[2])
    logsByDay[day] = l
  })

  const selectedLog = selectedDay ? logsByDay[selectedDay] : null

  // Monthly summary
  const avgCalories = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.totalCalories, 0) / logs.length) : 0
  const avgProtein = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.totalProtein, 0) / logs.length) : 0
  const totalMealsMonth = logs.reduce((s, l) => s + l.mealsCount, 0)

  // Chart data for week
  const chartData = weekData.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short' }),
  }))

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Historial Nutricional
        </h1>
        <p className="text-white/60 mt-1">Revisa tu progreso diario y mensual.</p>
      </div>

      {/* Stats Row */}
      <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-3xl font-bold text-brand-600">{stats?.streak || 0}</div>
          <div className="text-xs text-white/50 font-medium mt-1">🔥 Racha actual (días)</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-3xl font-bold text-white/90">{stats?.totalDays || 0}</div>
          <div className="text-xs text-white/50 font-medium mt-1">📅 Días registrados</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-3xl font-bold text-orange-500">{avgCalories}</div>
          <div className="text-xs text-white/50 font-medium mt-1">⚡ Promedio kcal/día (mes)</div>
        </div>
        <div className="glass-card p-4 text-center hover:translate-y-0">
          <div className="text-3xl font-bold text-blue-500">{totalMealsMonth}</div>
          <div className="text-xs text-white/50 font-medium mt-1">🍽️ Comidas este mes</div>
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVars} className="glass-card">
        <h2 className="text-lg font-bold text-white/90 flex items-center gap-2 mb-4">
          <TrendingUp className="text-brand-500" size={20} />
          Últimos 7 días
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                formatter={(value, name) => {
                  const labels = { totalCalories: 'Calorías', totalProtein: 'Proteína (g)', totalCarbs: 'Carbos (g)', totalFat: 'Grasa (g)' }
                  return [value, labels[name] || name]
                }}
              />
              <Area type="monotone" dataKey="totalCalories" stroke="#22c55e" fill="url(#calGrad)" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Calendar */}
        <motion.div variants={itemVars} className="glass-card md:col-span-5">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-white/50" />
            </button>
            <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
              <Calendar className="text-brand-500" size={20} />
              {MONTHS[month - 1]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ChevronRight size={20} className="text-white/50" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-white/50 uppercase">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const log = logsByDay[day]
              const isSelected = selectedDay === day
              const isToday = day === now.getDate() && month === (now.getMonth() + 1) && year === now.getFullYear()

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`aspect-square rounded-xl text-sm font-medium transition-all relative ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : isToday
                        ? 'bg-brand-50 text-brand-700 border-2 border-brand-300'
                        : log
                          ? 'bg-dark-800/50 text-white/80 hover:bg-brand-50'
                          : 'text-white/50 hover:bg-dark-800/50'
                  }`}
                >
                  {day}
                  {log && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Day Detail */}
        <motion.div variants={itemVars} className="glass-card md:col-span-7">
          {selectedLog ? (
            <div>
              <h2 className="text-lg font-bold text-white/90 mb-4">
                📋 Detalle del {selectedDay} de {MONTHS[month - 1]}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                  <Flame className="mx-auto text-orange-500 mb-1" size={18} />
                  <div className="text-lg font-bold text-orange-600">{selectedLog.totalCalories}</div>
                  <div className="text-[10px] text-orange-400">kcal</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <Beef className="mx-auto text-red-500 mb-1" size={18} />
                  <div className="text-lg font-bold text-red-600">{selectedLog.totalProtein}g</div>
                  <div className="text-[10px] text-red-400">Proteína</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <Wheat className="mx-auto text-amber-500 mb-1" size={18} />
                  <div className="text-lg font-bold text-amber-600">{selectedLog.totalCarbs}g</div>
                  <div className="text-[10px] text-amber-400">Carbos</div>
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                  <Droplets className="mx-auto text-violet-500 mb-1" size={18} />
                  <div className="text-lg font-bold text-violet-600">{selectedLog.totalFat}g</div>
                  <div className="text-[10px] text-violet-400">Grasa</div>
                </div>
              </div>

              {selectedLog.waterGlasses > 0 && (
                <div className="flex items-center gap-2 mb-4 bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                  💧 {selectedLog.waterGlasses} vasos de agua
                </div>
              )}

              <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Comidas registradas ({selectedLog.mealsCount})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedLog.meals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-dark-800 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="font-medium text-white/80">{m.name}</span>
                      <div className="flex gap-2 text-xs text-white/50 mt-0.5">
                        <span>{m.mealType}</span>
                        <span>•</span>
                        <span>{new Date(m.consumed_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-brand-600">{m.calories} kcal</div>
                      <div className="text-xs text-white/50">P:{m.protein}g C:{m.carbs}g G:{m.fat}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <Calendar className="text-white/30 mb-4" size={48} />
              <h3 className="text-lg font-medium text-white/60">Selecciona un día</h3>
              <p className="text-sm text-white/50 mt-1">Los días con punto verde tienen registros archivados.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Macros Chart */}
      {logs.length > 0 && (
        <motion.div variants={itemVars} className="glass-card">
          <h2 className="text-lg font-bold text-white/90 flex items-center gap-2 mb-4">
            📊 Macros del Mes
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logs.slice().sort((a,b) => a.date.localeCompare(b.date)).map(l => ({
                day: parseInt(l.date.split('-')[2]),
                Proteína: l.totalProtein,
                Carbos: l.totalCarbs,
                Grasa: l.totalFat,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Proteína" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Carbos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Grasa" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
