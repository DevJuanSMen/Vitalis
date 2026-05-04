import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, LogOut, User as UserIcon, Menu, X, Dumbbell } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuthActions()
  const user = useQuery(api.users?.getMe)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Cierra el menú al cambiar de página
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  async function logout() {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { name: 'Dashboard', path: '/home' },
    { name: 'Nutrición', path: '/calories' },
    { name: 'Entrenamiento', path: '/workouts' },
    { name: 'Progreso', path: '/body' },
    { name: 'Historial', path: '/history' },
    { name: 'Suplementos', path: '/supplements' },
    { name: '🤖 IA', path: '/ai' },
  ]

  return (
    <header className="fixed w-full top-0 z-50 glass-nav font-sans">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20"
          >
            <Activity size={22} />
          </motion.div>
          <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            VITALIS<span className="text-brand-500 font-light">AI</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user !== null && navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium text-sm transition-colors ${isActive ? 'text-brand-400' : 'text-white/50 hover:text-white'}`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden md:flex flex-1 md:flex-none justify-end items-center gap-4">
          {user === undefined ? (
            <div className="w-8 h-8 rounded-full bg-brand-900 animate-pulse"></div>
          ) : user === null ? (
            <>
              <Link to="/login" className="text-white/50 font-medium hover:text-white text-sm">Entrar</Link>
              <Link to="/register" className="btn-primary py-2 px-4 shadow-sm text-sm">Empezar</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 rounded-full pl-2 pr-4 py-1.5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center overflow-hidden">
                  <UserIcon size={14} />
                </div>
                <span className="text-white/30 text-sm font-medium">{user?.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={logout}
                className="text-white/60 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white/70 focus:outline-none p-2 bg-white/5/50 rounded-xl"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-dark-900/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl absolute w-full left-0 right-0 top-[72px]"
          >
            <div className="px-6 py-8 flex flex-col gap-4">
              {user !== null && navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block font-bold text-lg py-3 px-4 rounded-2xl transition-all ${isActive ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-white/60 hover:bg-white/5'}`}
                  >
                    {link.name}
                  </Link>
                )
              })}

              <div className="h-px bg-white/5 my-2"></div>

              {user === null ? (
                <div className="flex flex-col gap-4">
                  <Link to="/login" className="text-center text-white/70 font-bold py-3 rounded-2xl hover:bg-white/5">Entrar</Link>
                  <Link to="/register" className="btn-primary text-center py-4 text-lg">Empezar Ahora</Link>
                </div>
              ) : user !== undefined ? (
                <div className="flex flex-col gap-6 pt-2">
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">Usuario</p>
                      <p className="text-white font-black">{user?.email?.split('@')[0]}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="flex items-center justify-center gap-3 text-red-400 font-bold bg-red-500/10 py-4 px-4 rounded-2xl border border-red-500/20">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
