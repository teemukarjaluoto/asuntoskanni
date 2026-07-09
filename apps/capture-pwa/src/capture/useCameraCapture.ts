import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export interface CapturedFrame {
  id: number
  blob: Blob
  url: string
  t: number
}

export type CaptureStatus = 'idle' | 'ready' | 'capturing' | 'error'

/** Keyframe-väli: ~2 fps riittää fotogrammetriaan/splattaukseen kun liikutaan hitaasti. */
const CAPTURE_INTERVAL_MS = 500
const JPEG_QUALITY = 0.85

export function useCameraCapture(videoRef: RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [frames, setFrames] = useState<CapturedFrame[]>([])

  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const startCamera = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Selain ei tue kameran käyttöä (getUserMedia).')
      setStatus('error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      setStatus('ready')
    } catch (e) {
      setError(describeCameraError(e))
      setStatus('error')
    }
  }, [videoRef])

  const grabFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    let canvas = canvasRef.current
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvasRef.current = canvas
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const id = idRef.current++
        setFrames((prev) => [...prev, { id, blob, url: URL.createObjectURL(blob), t: Date.now() }])
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  }, [videoRef])

  const startCapture = useCallback(() => {
    setStatus((s) => (s === 'ready' || s === 'capturing' ? 'capturing' : s))
    if (timerRef.current !== null) return
    grabFrame()
    timerRef.current = window.setInterval(grabFrame, CAPTURE_INTERVAL_MS)
  }, [grabFrame])

  const stopCapture = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setStatus((s) => (s === 'capturing' ? 'ready' : s))
  }, [])

  const reset = useCallback(() => {
    stopCapture()
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url))
      return []
    })
    idRef.current = 0
  }, [stopCapture])

  const stopCamera = useCallback(() => {
    stopCapture()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStatus('idle')
  }, [stopCapture])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { status, error, frames, startCamera, startCapture, stopCapture, reset, stopCamera }
}

function describeCameraError(e: unknown): string {
  const err = e as DOMException
  const secure = location.protocol === 'https:' || location.hostname === 'localhost'
  if (!secure) return 'Kamera vaatii HTTPS-yhteyden. Avaa sovellus https-osoitteesta.'
  if (err?.name === 'NotAllowedError') return 'Kameran käyttö estetty. Salli kamera selaimen asetuksista.'
  if (err?.name === 'NotFoundError') return 'Kameraa ei löytynyt tästä laitteesta.'
  if (err?.name === 'NotReadableError') return 'Kamera on toisen sovelluksen käytössä.'
  return 'Kameran käynnistys epäonnistui: ' + (err?.message ?? String(e))
}
