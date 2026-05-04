import React from 'react'

export default function Card({ children, title, headerImage }) {
  return (
    <div className="card-visual">
      {headerImage ? (
        <div className="w-full h-40 overflow-hidden rounded-t-xl">
          <img src={headerImage} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : null}
      <div className="p-3">
        {title && <h3 className="font-semibold mb-2 text-food-green">{title}</h3>}
        {children}
      </div>
    </div>
  )
}
