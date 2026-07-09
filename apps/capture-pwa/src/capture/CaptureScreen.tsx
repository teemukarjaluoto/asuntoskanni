import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { useCameraCapture } from './useCameraCapture'

export function CaptureScreen() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { status, error, frames, startCamera, startCapture, stopCapture, reset } =
    useCameraCapture(videoRef)
  const [exporting, setExporting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    if (status === 'capturing') {
      if (startedAt.current === null) startedAt.current = Date.now()
      const id = window.setInterval(() => {
        if (startedAt.current !== null) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
      }, 250)
      return () => clearInterval(id)
    }
    if (status === 'idle') {
      startedAt.current = null
      setElapsed(0)
    }
  }, [status])

  const totalMB = useMemo(
    () => (frames.reduce((s, f) => s + f.blob.size, 0) / (1024 * 1024)).toFixed(1),
    [frames],
  )
  const lastThumbs = useMemo(() => frames.slice(-8).reverse(), [frames])

  async function exportZip() {
    if (!frames.length) return
    setExporting(true)
    try {
      const zip = new JSZip()
      frames.forEach((f, i) => zip.file(`frame_${String(i).padStart(4, '0')}.jpg`, f.blob))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asuntoskanni_${stamp()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="capture">
      <div className="stage">
        <video ref={videoRef} className="preview" playsInline muted autoPlay />

        {status === 'idle' && (
          <div className="overlay center">
            <h1>AsuntoSkanni</h1>
            <p className="muted">
              Skannaa asunto kuvaamalla. Liiku hitaasti, pidä kuvat limittäin ja kuvaa jokainen pinta
              useasta kulmasta.
            </p>
            <button className="btn primary" onClick={startCamera}>
              Käynnistä kamera
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="overlay center">
            <h2>Kamera ei käynnistynyt</h2>
            <p className="error">{error}</p>
            <button className="btn" onClick={startCamera}>
              Yritä uudelleen
            </button>
          </div>
        )}

        {status === 'capturing' && (
          <div className="hud">
            <span className="rec">● REC</span>
            <span>{frames.length} kuvaa</span>
            <span>{fmt(elapsed)}</span>
          </div>
        )}

        {status === 'capturing' && (
          <div className="tip">Liiku hitaasti · pidä ~50% limitystä · kierrä huone reunoja myöten</div>
        )}
      </div>

      <div className="controls">
        {status === 'ready' && (
          <button className="btn primary big" onClick={startCapture}>
            {frames.length ? 'Jatka skannausta' : 'Aloita skannaus'}
          </button>
        )}
        {status === 'capturing' && (
          <button className="btn danger big" onClick={stopCapture}>
            Lopeta skannaus
          </button>
        )}

        {(status === 'ready' || status === 'capturing') && frames.length > 0 && (
          <div className="review">
            <div className="stats">
              <strong>{frames.length}</strong> kuvaa · {totalMB} MB
            </div>
            <div className="thumbs">
              {lastThumbs.map((f) => (
                <img key={f.id} src={f.url} alt="" />
              ))}
            </div>
            <div className="row">
              <button className="btn" onClick={exportZip} disabled={exporting || status === 'capturing'}>
                {exporting ? 'Pakataan…' : 'Vie kuvat (.zip)'}
              </button>
              <button
                className="btn ghost"
                onClick={reset}
                disabled={exporting || status === 'capturing'}
              >
                Tyhjennä
              </button>
            </div>
            <p className="muted small">
              Lataus palvelimelle + 3D-rekonstruktio tulevat seuraavassa vaiheessa. Toistaiseksi kuvat
              voi viedä zip-pakettina.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function stamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}
