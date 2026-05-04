import React, { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Trans() {
  const [treatment, setTreatment] = useState('')
  const [dose, setDose] = useState('')
  const [entries, setEntries] = useState([])

  function add() {
    if (!treatment) return
    setEntries([...entries, { id: Date.now(), treatment, dose }])
    setTreatment('')
    setDose('')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="Registro de tratamiento hormonal">
        <div className="space-y-2">
          <input
            className="w-full p-2 border rounded"
            placeholder="Tipo de tratamiento"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Dosis (ej. 10 mg)"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />
          <Button onClick={add}>Registrar</Button>
        </div>
      </Card>

      <Card title="Recomendaciones nutricionales">
        <ul className="list-disc ml-5">
          <li>Asegurar suficiente ingesta proteica diaria.</li>
          <li>Micronutrientes: hierro, calcio y vitamina D según necesidad.</li>
          <li>Consumo regular de grasas saludables y fibra.</li>
        </ul>
      </Card>

      <Card title="Tratamientos registrados">
        {entries.length === 0 && <p>No hay registros.</p>}
        {entries.map((e) => (
          <div key={e.id} className="mb-2">
            <div className="font-medium">{e.treatment}</div>
            <div className="text-sm text-gray-500">{e.dose}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}
