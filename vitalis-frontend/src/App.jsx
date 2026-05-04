import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Calories from './pages/Calories'
import History from './pages/History'
import Recipes from './pages/Recipes'
import Supplements from './pages/Supplements'
import AIChat from './pages/AIChat'
import Workouts from './pages/Workouts'
import BodyTracking from './pages/BodyTracking'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-20 md:pt-24 pb-20">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
          <Route path="/body" element={<ProtectedRoute><BodyTracking /></ProtectedRoute>} />
          <Route path="/calories" element={<ProtectedRoute><Calories /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/supplements" element={<ProtectedRoute><Supplements /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
