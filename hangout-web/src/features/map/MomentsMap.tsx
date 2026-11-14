import 'leaflet/dist/leaflet.css'
import type { LatLngBounds } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { MapPin } from '@/api/types'
import { photoPin, TILE_ATTRIBUTION, TILE_URL } from './leafletPins'

export interface PlacePins {
  placeId: string
  pins: MapPin[]
}

interface Props {
  groups: PlacePins[]
  selected: string | null
  onSelect: (placeId: string | null) => void
  onBounds: (bbox: string) => void
  center: [number, number]
}

const toBbox = (b: LatLngBounds) =>
  [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(5)).join(',')

/** Reports the visible area so only pins in view are fetched (GET /map/moments?bbox=). */
function BoundsWatcher({ onBounds, onSelect }: Pick<Props, 'onBounds' | 'onSelect'>) {
  const map = useMap()
  useEffect(() => {
    onBounds(toBbox(map.getBounds()))
  }, [map, onBounds])
  useMapEvents({
    moveend: () => onBounds(toBbox(map.getBounds())),
    click: () => onSelect(null),
  })
  return null
}

/** Moment pins: friends' (coral ring) and shared to place pages (indigo ring). Lazy-loaded. */
export default function MomentsMap({ groups, selected, onSelect, onBounds, center }: Props) {
  return (
    <MapContainer center={center} zoom={15} className="h-full w-full" zoomControl>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <BoundsWatcher onBounds={onBounds} onSelect={onSelect} />
      {groups.map(({ placeId, pins }) => {
        const first = pins[0]
        return (
          <Marker
            key={placeId}
            position={[first.place.lat, first.place.lng]}
            icon={photoPin(first.photo, pins.length, pins.some((p) => p.fromFriend), placeId === selected)}
            title={`${first.place.name}, ${pins.length} Moment${pins.length > 1 ? 's' : ''}`}
            keyboard
            zIndexOffset={placeId === selected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(placeId) }}
          />
        )
      })}
    </MapContainer>
  )
}
