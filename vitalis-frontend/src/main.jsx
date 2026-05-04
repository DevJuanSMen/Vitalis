import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from './App'
import './index.css'

// Esto asegura que use la URL correcta en cada entorno
const convexUrl = import.meta.env.VITE_CONVEX_URL;
console.log("Conectando a Convex en:", convexUrl);

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthProvider>
  </React.StrictMode>
)
