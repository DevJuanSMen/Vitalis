import React from 'react'
import { Navigate } from 'react-router-dom'
import { useConvexAuth } from "convex/react"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}
