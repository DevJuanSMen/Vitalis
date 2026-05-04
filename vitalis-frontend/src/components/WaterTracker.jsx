import React from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const GOAL = 8 // 8 glasses = 2L

export default function WaterTracker() {
  const waterLog = useQuery(api.waterLogs.getToday)
  const addGlass = useMutation(api.waterLogs.addGlass)
  const removeGlass = useMutation(api.waterLogs.removeGlass)

  const glasses = waterLog?.glasses || 0
  const pct = Math.min((glasses / GOAL) * 100, 100)

  return (
    <div className="glass-card flex items-center justify-between !py-4 !px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-16 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400"
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-white drop-shadow-md">{glasses}</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Droplets className="text-blue-400" size={14} /> Hidratación
          </h3>
          <p className="text-[10px] text-white/40 font-bold mt-0.5">
            {glasses >= GOAL ? '✅ Meta alcanzada' : `${GOAL - glasses} vasos para la meta (2L)`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => removeGlass()}
          disabled={glasses <= 0}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors disabled:opacity-20"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => addGlass()}
          className="w-10 h-10 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white flex items-center justify-center transition-all border border-blue-500/30"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
