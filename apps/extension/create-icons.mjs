// Genera íconos PNG del Picante (ají con anteojos) para la extensión.
// Corré con: node create-icons.mjs

import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

// ── CRC32 (requerido por PNG) ─────────────────────────────────────────────────
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  crcTable[i] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

// ── Dibuja el Picante pixel a pixel ──────────────────────────────────────────

// Devuelve [r,g,b] para la posición (x,y) en un canvas de tamaño S×S
function getPixel(x, y, S) {
  const cx = S / 2

  // ── Tallo ─────────────────────────────────────────────────────────────────
  const stemCx = cx - S * 0.04
  if (y < S * 0.22 && y > S * 0.05 && Math.abs(x - stemCx) < S * 0.06) {
    return [22, 163, 74]  // verde
  }

  // ── Hojas ──────────────────────────────────────────────────────────────────
  const leafY = S * 0.13
  // hoja izquierda
  const llx = x - (cx - S * 0.17), lly = y - leafY
  if ((llx / (S * 0.16)) ** 2 + (lly / (S * 0.08)) ** 2 < 1 && x < cx) {
    return [21, 128, 61]
  }
  // hoja derecha
  const rlx = x - (cx + S * 0.13), rly = y - (leafY + S * 0.02)
  if ((rlx / (S * 0.16)) ** 2 + (rly / (S * 0.08)) ** 2 < 1 && x > cx) {
    return [20, 120, 55]
  }

  // ── Cuerpo del ají ────────────────────────────────────────────────────────
  const bodyTop = S * 0.2
  const bodyBot = S * 0.92
  if (y >= bodyTop && y <= bodyBot) {
    const t = (y - bodyTop) / (bodyBot - bodyTop)
    // Perfil de ancho: amplio arriba, se afila abajo
    const hw = S * 0.29 * Math.sin(Math.sqrt(t) * Math.PI) * Math.min(1, t * 10)
    if (Math.abs(x - cx) < hw) {
      // Degradado: más claro a la izquierda (brillo)
      const highlight = Math.abs(x - cx) < hw * 0.4 && t < 0.5
      const dist = Math.abs(x - cx) / hw  // 0=centro, 1=borde

      // Anteojos: en la zona superior del cuerpo (t ≈ 0.18-0.30)
      if (S >= 48 && t > 0.15 && t < 0.32) {
        const glassY = y - (bodyTop + (bodyBot - bodyTop) * 0.22)
        const glassHH = S * 0.055
        if (Math.abs(glassY) < glassHH) {
          // Puente: zona central estrecha → negro
          if (Math.abs(x - cx) < S * 0.03) return [20, 20, 20]
          // Lentes: zona izquierda y derecha → negro
          if (Math.abs(x - cx) < hw * 0.85) {
            // Punta exterior angulada (proyección que sale del borde)
            return [17, 24, 39]
          }
        }
      }

      // Rojo con degradado y brillo
      const r = highlight ? 255 : Math.round(255 - dist * 60)
      const g = highlight ? 120 : Math.round(40 - dist * 30)
      const b = highlight ? 120 : Math.round(40 - dist * 30)
      return [Math.min(255,r), Math.max(0,g), Math.max(0,b)]
    }
  }

  // ── Fondo ─────────────────────────────────────────────────────────────────
  return [12, 2, 2]  // rojo muy oscuro
}

// ── Genera un PNG a partir de la función getPixel ─────────────────────────────

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = pngChunk('IHDR', Buffer.from([
    0, 0, 0, size, 0, 0, 0, size,
    8, 2, 0, 0, 0
  ]))

  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y, size)
      const px = y * (1 + size * 3) + 1 + x * 3
      raw[px] = r; raw[px+1] = g; raw[px+2] = b
    }
  }

  return Buffer.concat([sig, ihdr, pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public/icons', { recursive: true })

for (const size of [16, 48, 128]) {
  writeFileSync(`public/icons/icon${size}.png`, makePNG(size))
  console.log(`✅ icon${size}.png`)
}
console.log('🌶️  Íconos generados en public/icons/')
