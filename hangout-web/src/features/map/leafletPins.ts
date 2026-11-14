import L from 'leaflet'

/** Round pin with a label, in the brand colors (also used on the plan map). */
export function labelPin(label: string, color: string, size = 32) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;border:3px solid #fff;box-shadow:0 2px 6px rgb(0 0 0/.3);font:700 13px 'Bricolage Grotesque',sans-serif;background:${color};color:#fff">${label}</span>`,
  })
}

/** Pin with the cover photo of a Moment and a count badge. */
export function photoPin(photo: string | null, count: number, friend: boolean, active: boolean) {
  const ring = active ? '#1c1638' : friend ? '#ff6b5a' : '#3b2f8f'
  const size = active ? 52 : 44
  const img = photo
    ? `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:999px"/>`
    : ''
  const badge =
    count > 1
      ? `<span style="position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#1c1638;color:#fff;font:700 11px Inter,sans-serif;display:grid;place-items:center;border:2px solid #fff">${count}</span>`
      : ''
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="position:relative;display:block;width:${size}px;height:${size}px;border-radius:999px;border:3px solid ${ring};background:${ring};box-shadow:0 3px 8px rgb(0 0 0/.3)">${img}${badge}</span>`,
  })
}

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
