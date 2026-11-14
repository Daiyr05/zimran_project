import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { Plan, SearchResponse } from '@/api/types'
import { stopsOf } from './labels'

interface Props {
  plan: Plan
  start: SearchResponse['start']
}

function pin(label: string, home = false) {
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:999px;border:3px solid #fff;box-shadow:0 2px 6px rgb(0 0 0/.3);font:700 14px 'Bricolage Grotesque',sans-serif;background:${home ? '#1c1638' : '#ff6b5a'};color:#fff">${label}</span>`,
  })
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 })
  }, [map, points])
  return null
}

/** Numbered stops and the route from the start and back (FR-MAP-1). Lazy-loaded. */
export default function PlanMap({ plan, start }: Props) {
  const stops = stopsOf(plan)
  const points = useMemo<[number, number][]>(() => {
    const home: [number, number] = [start.lat, start.lng]
    const route = plan.timeline.flatMap((t) => (t.type === 'STOP' ? [[t.place.lat, t.place.lng] as [number, number]] : []))
    return [home, ...route, home]
  }, [plan.timeline, start.lat, start.lng])

  return (
    <MapContainer
      center={[start.lat, start.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} pathOptions={{ color: '#3b2f8f', weight: 4, dashArray: '6 8', opacity: 0.8 }} />
      <Marker position={[start.lat, start.lng]} icon={pin('⌂', true)} title={start.label} />
      {stops.map((s) => (
        <Marker key={s.place.id} position={[s.place.lat, s.place.lng]} icon={pin(String(s.position))} title={s.place.name} />
      ))}
      <FitBounds points={points} />
    </MapContainer>
  )
}
