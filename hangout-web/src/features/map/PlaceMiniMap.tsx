import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { labelPin, TILE_ATTRIBUTION, TILE_URL } from './leafletPins'

/** One pin for the place page. Lazy-loaded. */
export default function PlaceMiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <Marker position={[lat, lng]} icon={labelPin('●', '#ff6b5a')} title={name} />
    </MapContainer>
  )
}
