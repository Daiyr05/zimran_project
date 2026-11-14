export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // FR-MOMENT-1

/** Checks one picked file. Returns an error message, or null when it is fine. */
export function checkPhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return `${file.name}: use a JPEG, PNG or WebP photo`
  if (file.size > MAX_PHOTO_BYTES) return `${file.name} is over 5 MB`
  return null
}

/**
 * Shrinks a photo to at most 1600 px on the long side before upload, so phones on mobile
 * data upload ~300 KB instead of 4 MB. Falls back to the original file if the browser can't.
 */
export async function shrinkPhoto(file: File, maxSide = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 800_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ?? file
  } catch {
    return file
  }
}
