# AsuntoSkanni (työnimi)

Puhelimella kuvattu **3D-asuntoskannaus fotorealistisiin virtuaaliesittelyihin**.
Käyttäjä kuvaa asunnon liikkuen → pilvirekonstruktio (Gaussian Splatting) → jaettava 3D-läpikävely.

## Arkkitehtuuri

```
[apps/capture-pwa]  Puhelimen selain: ohjattu videokuvaus → keyframet
        │  upload
        ▼
[services/api]      FastAPI: skannaukset, upload, jono, tallennus (MinIO/R2)   (tulossa)
        │  laukaisee työn
        ▼
[services/worker]   GPU (vuokra on-demand): COLMAP (SfM) → gsplat → .splat     (tulossa)
        │  palauttaa mallin
        ▼
[apps/viewer]       Web-splat-katselin (WebGL/WebGPU), jaettava linkki/asunto  (tulossa)
```

Päätökset: fotorealistinen (Gaussian Splatting) · mikä tahansa puhelin (PWA, kamera-only) ·
oma rekonstruktioputki · GPU vuokrataan per skannaus (Runpod/Vast/Lambda).

## Paketit

| Polku | Kuvaus | Tila |
|---|---|---|
| `apps/capture-pwa` | Kaappaus-PWA (Vite + React + TS) | 🚧 Increment 1 |
| `services/api` | Upload + jono + tallennus (FastAPI) | ⏳ |
| `services/worker` | Rekonstruktio (COLMAP + gsplat) | ⏳ |
| `apps/viewer` | Splat-katselin | ⏳ |

## Kaappaus-PWA — kehitys

```bash
cd apps/capture-pwa
npm install
npm run dev        # http://localhost:5173  (kamera toimii localhostissa)
npm run build      # tuotantobuild -> dist/
```

> **Huom:** kamera (getUserMedia) vaatii **HTTPS**-yhteyden oikealla puhelimella.
> Testaus puhelimessa: deploy https-osoitteeseen (Coolify) tai käytä tunnelia.
