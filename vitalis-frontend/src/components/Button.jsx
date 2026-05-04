import React from 'react'

export default function Button({ children, onClick, className = '', variant = 'primary' }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-accent'
  return (
    <button onClick={onClick} className={`${base} ${className}`}>
      {children}
    </button>
  )
}
