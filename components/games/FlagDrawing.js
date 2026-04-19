'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase-client'

// ─── Flag definitions — MINIMAL: only name + ratio + hasEmblem ───────────────
// All colors, zones, guides are AUTO-DETECTED from flagcdn images at runtime
const FLAG_DEFS = {
  fr: { en: 'France',      fr: 'France',       ratio: 1.5,    hasEmblem: false },
  de: { en: 'Germany',     fr: 'Allemagne',     ratio: 5/3,    hasEmblem: false },
  it: { en: 'Italy',       fr: 'Italie',        ratio: 1.5,    hasEmblem: false },
  be: { en: 'Belgium',     fr: 'Belgique',      ratio: 15/13,  hasEmblem: false },
  nl: { en: 'Netherlands', fr: 'Pays-Bas',      ratio: 1.5,    hasEmblem: false },
  ru: { en: 'Russia',      fr: 'Russie',        ratio: 1.5,    hasEmblem: false },
  ie: { en: 'Ireland',     fr: 'Irlande',       ratio: 2.0,    hasEmblem: false },
  ro: { en: 'Romania',     fr: 'Roumanie',      ratio: 1.5,    hasEmblem: false },
  pl: { en: 'Poland',      fr: 'Pologne',       ratio: 8/5,    hasEmblem: false },
  ua: { en: 'Ukraine',     fr: 'Ukraine',       ratio: 1.5,    hasEmblem: false },
  at: { en: 'Austria',     fr: 'Autriche',      ratio: 1.5,    hasEmblem: false },
  hu: { en: 'Hungary',     fr: 'Hongrie',       ratio: 2.0,    hasEmblem: false },
  ee: { en: 'Estonia',     fr: 'Estonie',       ratio: 11/7,   hasEmblem: false },
  lv: { en: 'Latvia',      fr: 'Lettonie',      ratio: 2.0,    hasEmblem: false },
  id: { en: 'Indonesia',   fr: 'Indonésie',     ratio: 1.5,    hasEmblem: false },
  ci: { en: 'Ivory Coast', fr: "Côte d'Ivoire", ratio: 1.5,    hasEmblem: false },
  ml: { en: 'Mali',        fr: 'Mali',          ratio: 1.5,    hasEmblem: false },
  td: { en: 'Chad',        fr: 'Tchad',         ratio: 1.5,    hasEmblem: false },
  sn: { en: 'Senegal',     fr: 'Sénégal',       ratio: 1.5,    hasEmblem: false },
  cm: { en: 'Cameroon',    fr: 'Cameroun',      ratio: 1.5,    hasEmblem: false },
  ng: { en: 'Nigeria',     fr: 'Nigeria',       ratio: 2.0,    hasEmblem: false },
  gh: { en: 'Ghana',       fr: 'Ghana',         ratio: 1.5,    hasEmblem: false },
  co: { en: 'Colombia',    fr: 'Colombie',      ratio: 1.5,    hasEmblem: false },
  ar: { en: 'Argentina',   fr: 'Argentine',     ratio: 14/9,   hasEmblem: false },
  jp: { en: 'Japan',       fr: 'Japon',         ratio: 1.5,    hasEmblem: false },
  th: { en: 'Thailand',    fr: 'Thaïlande',     ratio: 1.5,    hasEmblem: false },
  ch: { en: 'Switzerland', fr: 'Suisse',        ratio: 1.0,    hasEmblem: false },
  no: { en: 'Norway',      fr: 'Norvège',       ratio: 11/8,   hasEmblem: false },
  dk: { en: 'Denmark',     fr: 'Danemark',      ratio: 37/28,  hasEmblem: false },
  se: { en: 'Sweden',      fr: 'Suède',         ratio: 8/5,    hasEmblem: false },
  fi: { en: 'Finland',     fr: 'Finlande',      ratio: 18/11,  hasEmblem: false },
  lk: { en: 'Sri Lanka',   fr: 'Sri Lanka',     ratio: 2.0,    hasEmblem: true  },
  ht: { en: 'Haiti',       fr: 'Haïti',         ratio: 5/3,    hasEmblem: true  },
  gt: { en: 'Guatemala',   fr: 'Guatemala',     ratio: 8/5,    hasEmblem: true  },
  dm: { en: 'Dominica',    fr: 'Dominique',     ratio: 2.0,    hasEmblem: true  },
  ni: { en: 'Nicaragua',   fr: 'Nicaragua',     ratio: 5/3,    hasEmblem: true  },
}

const FLAG_KEYS = Object.keys(FLAG_DEFS)
const CANVAS_W = 480
const MAX_LIVES = 3
const SCREEN = { SETUP: 'setup', PLAYING: 'playing', RESULT: 'result', GAMEOVER: 'gameover' }
const TOOL = { FILL: 'fill', BRUSH: 'brush', ERASER: 'eraser' }

// ─── Auto color extraction via k-means on flagcdn image ──────────────────────
function extractDominantColors(imageData, W, H, k = 8) {
  const data = imageData.data
  // Sample every 4th pixel for speed
  const samples = []
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
    if (a < 200) continue // skip transparent
    samples.push([r, g, b])
  }
  if (samples.length === 0) return []

  // Simple k-means, 10 iterations
  let centroids = samples.slice(0, k).map(s => [...s])
  for (let iter = 0; iter < 12; iter++) {
    const clusters = Array.from({length: k}, () => [])
    for (const [r, g, b] of samples) {
      let best = 0, bestD = Infinity
      for (let ci = 0; ci < k; ci++) {
        const [cr, cg, cb] = centroids[ci]
        const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
        if (d < bestD) { bestD = d; best = ci }
      }
      clusters[best].push([r, g, b])
    }
    for (let ci = 0; ci < k; ci++) {
      if (clusters[ci].length === 0) continue
      const n = clusters[ci].length
      centroids[ci] = [
        Math.round(clusters[ci].reduce((s,c) => s+c[0], 0) / n),
        Math.round(clusters[ci].reduce((s,c) => s+c[1], 0) / n),
        Math.round(clusters[ci].reduce((s,c) => s+c[2], 0) / n),
      ]
    }
  }

  // Count cluster sizes and sort by frequency
  const counts = Array(k).fill(0)
  for (const [r, g, b] of samples) {
    let best = 0, bestD = Infinity
    for (let ci = 0; ci < k; ci++) {
      const [cr, cg, cb] = centroids[ci]
      const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
      if (d < bestD) { bestD = d; best = ci }
    }
    counts[best]++
  }

  return centroids
    .map(([r, g, b], i) => ({ r, g, b, count: counts[i], hex: rgbToHex(r, g, b) }))
    .filter(c => c.count > samples.length * 0.02) // at least 2% of pixels
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return [r, g, b]
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
}

// Make a color slightly more saturated/vibrant for UI display
function vibrantHex(hex) {
  let [r, g, b] = hexToRgb(hex)
  // Convert to HSL, boost saturation, convert back
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h, s, l = (max+min)/2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break
      case g: h = ((b-r)/d + 2)/6; break
      default: h = ((r-g)/d + 4)/6
    }
  }
  s = Math.min(1, s * 1.3) // boost saturation 30%
  // HSL back to RGB
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q-p)*6*t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q-p)*(2/3-t)*6
    return p
  }
  let nr, ng, nb
  if (s === 0) { nr = ng = nb = l }
  else {
    const q = l < 0.5 ? l*(1+s) : l+s-l*s
    const p = 2*l - q
    nr = hue2rgb(p, q, h+1/3)
    ng = hue2rgb(p, q, h)
    nb = hue2rgb(p, q, h-1/3)
  }
  return rgbToHex(Math.round(nr*255), Math.round(ng*255), Math.round(nb*255))
}

// ─── Color segmentation → thick boundary lines ───────────────────────────────
// Step 1: quantize every pixel to its nearest dominant color (from k-means result)
// Step 2: find pixels where neighbors belong to a different segment → boundary
// Step 3: dilate boundaries by BORDER_RADIUS pixels → thick walls the fill can't cross

const BORDER_RADIUS = 3  // px thickness of guide lines — must be >= 3 to block flood fill

function buildSegmentMap(imageData, W, H, centroids) {
  // Assign each pixel to its nearest centroid
  const src = imageData.data
  const seg = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = src[i*4], g = src[i*4+1], b = src[i*4+2]
    let best = 0, bestD = Infinity
    for (let ci = 0; ci < centroids.length; ci++) {
      const [cr, cg, cb] = centroids[ci]
      const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2
      if (d < bestD) { bestD = d; best = ci }
    }
    seg[i] = best
  }
  return seg
}

function buildBoundaryMap(seg, W, H) {
  // Mark pixels where any neighbor has a different segment
  const boundary = new Uint8Array(W * H)
  for (let y = 1; y < H-1; y++) {
    for (let x = 1; x < W-1; x++) {
      const s = seg[y*W+x]
      if (seg[y*W+x+1] !== s || seg[y*W+x-1] !== s ||
          seg[(y+1)*W+x] !== s || seg[(y-1)*W+x] !== s) {
        boundary[y*W+x] = 1
      }
    }
  }
  return boundary
}

function dilateBoundary(boundary, W, H, radius) {
  // Expand each boundary pixel by radius in all directions
  const dilated = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!boundary[y*W+x]) continue
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x+dx, ny = y+dy
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            dilated[ny*W+nx] = 1
          }
        }
      }
    }
  }
  return dilated
}

// Build guide canvas: white background + thick dark borders between color zones
function buildGuideCanvas(ctx, imageData, W, H, centroids) {
  // Get raw centroid arrays for segmentation
  const centroidArrays = centroids.map(c => [c.r, c.g, c.b])
  const seg = buildSegmentMap(imageData, W, H, centroidArrays)
  const boundary = buildBoundaryMap(seg, W, H)
  const thick = dilateBoundary(boundary, W, H, BORDER_RADIUS)

  // Write to canvas: white everywhere, dark navy on boundary
  const out = ctx.createImageData(W, H)
  const d = out.data
  for (let i = 0; i < W * H; i++) {
    if (thick[i]) {
      d[i*4]=15; d[i*4+1]=30; d[i*4+2]=60; d[i*4+3]=255
    } else {
      d[i*4]=255; d[i*4+1]=255; d[i*4+2]=255; d[i*4+3]=255
    }
  }
  ctx.putImageData(out, 0, 0)
  return thick // return for use in emblem masking
}

// ─── Emblem detection — find the "complex" center region ─────────────────────
// Returns { x, y, w, h } as fractions 0-1, or null for simple flags
function detectEmblemRegion(imageData, W, H) {
  // Divide flag into a grid of cells, measure color variance per cell
  const cols = 12, rows = 8
  const cw = W / cols, ch = H / rows
  const variance = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = Math.round(col * cw), y0 = Math.round(row * ch)
      const x1 = Math.round((col+1) * cw), y1 = Math.round((row+1) * ch)
      let rSum=0, gSum=0, bSum=0, n=0
      const pixels = []
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y*W+x)*4
          const r=imageData.data[i], g=imageData.data[i+1], b=imageData.data[i+2]
          rSum+=r; gSum+=g; bSum+=b; n++
          pixels.push([r,g,b])
        }
      }
      if (n === 0) { variance.push(0); continue }
      const mr=rSum/n, mg=gSum/n, mb=bSum/n
      const v = pixels.reduce((s,[r,g,b]) => s + (r-mr)**2 + (g-mg)**2 + (b-mb)**2, 0) / n
      variance.push(v)
    }
  }

  // Find the bounding box of high-variance cells (likely emblem area)
  const maxV = Math.max(...variance)
  const threshold = maxV * 0.3
  const highV = variance.map(v => v > threshold)

  let minCol=cols, maxCol=0, minRow=rows, maxRow=0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (highV[row*cols+col]) {
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
      }
    }
  }

  if (maxCol <= minCol || maxRow <= minRow) return null

  // Add some padding
  return {
    x: Math.max(0, (minCol - 0.5) / cols),
    y: Math.max(0, (minRow - 0.5) / rows),
    w: Math.min(1, (maxCol - minCol + 2) / cols),
    h: Math.min(1, (maxRow - minRow + 2) / rows),
  }
}

// ─── Flood fill ───────────────────────────────────────────────────────────────
function floodFill(imageData, W, H, startX, startY, fillHex) {
  const [fr, fg, fb] = hexToRgb(fillHex)
  const d = imageData.data
  const idx = (x, y) => (y * W + x) * 4
  const si = idx(startX, startY)
  const tr = d[si], tg = d[si+1], tb = d[si+2]

  // Don't fill dark guide pixels or same color
  if (tr + tg + tb < 120) return
  if (colorDistance(tr,tg,tb, fr,fg,fb) < 8) return

  const stack = [[startX, startY]]
  const visited = new Uint8Array(W * H)

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= W || y < 0 || y >= H) continue
    const vi = y * W + x
    if (visited[vi]) continue
    const pi = vi * 4
    const r = d[pi], g = d[pi+1], b = d[pi+2]
    if (r + g + b < 120) continue // dark border
    if (colorDistance(r,g,b, tr,tg,tb) > 45) continue // different zone
    visited[vi] = 1
    d[pi] = fr; d[pi+1] = fg; d[pi+2] = fb; d[pi+3] = 255
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
  }
}

// ─── Comparison — pixel similarity with tolerance ─────────────────────────────
function comparePixels(drawData, refData) {
  const len = drawData.data.length
  let total = 0, counted = 0
  const TOLERANCE = 50
  for (let i = 0; i < len; i += 4) {
    const r1=drawData.data[i], g1=drawData.data[i+1], b1=drawData.data[i+2]
    if (r1+g1+b1 < 120) continue // skip guide lines
    const r2=refData.data[i], g2=refData.data[i+1], b2=refData.data[i+2]
    const d = colorDistance(r1,g1,b1,r2,g2,b2)
    total += Math.max(0, d - TOLERANCE) / 441.67
    counted++
  }
  if (counted === 0) return 0
  return Math.min(100, Math.round((1 - total/counted) * 100))
}

// ─── Score formula ────────────────────────────────────────────────────────────
const DIFF_MULT = { easy: 1, medium: 1.5, hard: 2, extreme: 3 }
function calcPoints(pct, streak, diff) {
  return Math.round(100 * (pct/100)**2 * Math.pow(1.1, streak) * (DIFF_MULT[diff]||1))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlagDrawingV2() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen] = useState(SCREEN.SETUP)
  const [difficulty, setDifficulty] = useState('easy')
  const [isMobile, setIsMobile] = useState(false)

  // Game state
  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [lastPts, setLastPts] = useState(null)
  const [currentKey, setCurrentKey] = useState(null)
  const [score, setScore] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshotUrl, setSnapshotUrl] = useState(null)

  // Drawing state
  const [activeTool, setActiveTool] = useState(TOOL.FILL)
  const [activeColor, setActiveColor] = useState('#CE1126')
  const [brushSize, setBrushSize] = useState(8)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lineStart, setLineStart] = useState(null)
  const [customColor, setCustomColor] = useState('#CE1126')  // for custom color picker

  // Stats per difficulty from Supabase
  const [user, setUser] = useState(null)
  const [diffStats, setDiffStats] = useState({})  // { easy: { best_score, flags_drawn }, ... }

  // Auto-extracted per-flag state
  const [palette, setPalette] = useState([]) // [{hex, label}]
  const [flagLoading, setFlagLoading] = useState(false)

  const drawingCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const refCanvasRef = useRef(null)
  const queueRef = useRef([])
  const livesRef = useRef(MAX_LIVES)
  const streakRef = useRef(0)
  const undoStack = useRef([])  // array of ImageData snapshots
  const [undoCount, setUndoCount] = useState(0)  // triggers re-render when stack changes

  const cfg = {
    easy:    { showLines: true,  showName: true  },
    medium:  { showLines: true,  showName: false },
    hard:    { showLines: false, showName: false },
    extreme: { showLines: false, showName: false },
  }[difficulty]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Ctrl+Z / Cmd+Z keyboard shortcut ──────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // ── Auth + difficulty stats ────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadDiffStats(supabase, u.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadDiffStats(supabase, u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadDiffStats(supabase, userId) {
    const { data } = await supabase
      .from('game_scores')
      .select('mode, best_streak')
      .eq('user_id', userId)
      .like('mode', 'flag_drawing_%')
    if (data) {
      const map = {}
      data.forEach(row => {
        const diff = row.mode.replace('flag_drawing_', '')
        map[diff] = { best: row.best_streak }
      })
      setDiffStats(map)
    }
  }

  async function saveDiffScore(diff, score) {
    if (!user || score === 0) return
    const supabase = createClient()
    const key = `flag_drawing_${diff}`
    const prev = diffStats[diff]?.best ?? 0
    if (score <= prev) return
    await supabase.from('game_scores').upsert({
      user_id: user.id,
      mode: key,
      best_streak: score,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
    setDiffStats(prev => ({ ...prev, [diff]: { best: score } }))
  }

  // ── Load flag: fetch from flagcdn, extract colors + edges ──────────────────
  const loadFlag = useCallback((key) => {
    setCurrentKey(key)
    setScore(null)
    setSnapshotUrl(null)
    setFlagLoading(true)
    undoStack.current = []
    setUndoCount(0)
    setPalette([])

    const def = FLAG_DEFS[key]
    if (!def) return

    const W = CANVAS_W
    const H = Math.round(W / def.ratio)

    // Resize canvases
    for (const ref of [drawingCanvasRef, overlayCanvasRef, refCanvasRef]) {
      if (ref.current) { ref.current.width = W; ref.current.height = H }
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // ── 1. Draw real flag into ref canvas (ground truth for comparison) ──
      const refCtx = refCanvasRef.current?.getContext('2d')
      if (refCtx) {
        refCtx.clearRect(0, 0, W, H)
        refCtx.drawImage(img, 0, 0, W, H)
      }

      // ── 2. Extract dominant colors from flag image ──
      const colorCanvas = document.createElement('canvas')
      colorCanvas.width = W; colorCanvas.height = H
      const colorCtx = colorCanvas.getContext('2d')
      colorCtx.drawImage(img, 0, 0, W, H)
      const imgData = colorCtx.getImageData(0, 0, W, H)
      const extracted = extractDominantColors(imgData, W, H)
      const newPalette = extracted.map((c, i) => ({
        hex: vibrantHex(c.hex),
        rawHex: c.hex,
        label: `Color ${i+1}`,
      }))
      setPalette(newPalette)
      if (newPalette.length > 0) setActiveColor(newPalette[0].hex)

      // ── 3. Set up drawing canvas ──
      const drawCtx = drawingCanvasRef.current?.getContext('2d')
      if (!drawCtx) { setFlagLoading(false); return }

      if (cfg.showLines) {
        // Build guide canvas from color segmentation — thick boundaries block flood fill
        // Pass raw centroid data (not vibrant) for accurate segmentation
        buildGuideCanvas(drawCtx, imgData, W, H, extracted)
      } else {
        drawCtx.fillStyle = '#FFFFFF'
        drawCtx.fillRect(0, 0, W, H)
      }

      if (def.hasEmblem) {
        // Detect and stamp the emblem region from the real flag at full opacity
        const emblemRegion = detectEmblemRegion(imgData, W, H)
        if (emblemRegion) {
          const { x, y, w, h } = emblemRegion
          drawCtx.save()
          drawCtx.beginPath()
          drawCtx.rect(Math.round(x*W), Math.round(y*H), Math.round(w*W), Math.round(h*H))
          drawCtx.clip()
          drawCtx.drawImage(img, 0, 0, W, H)
          drawCtx.restore()
        }
      }

      // Clear overlay (used only for brush preview)
      const ov = overlayCanvasRef.current
      if (ov) ov.getContext('2d').clearRect(0, 0, W, H)

      setFlagLoading(false)
    }
    img.onerror = () => setFlagLoading(false)
    img.src = `https://flagcdn.com/w320/${key}.png`
  }, [difficulty, cfg])

  function startGame() {
    livesRef.current = MAX_LIVES
    streakRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setTotalScore(0)
    setLastPts(null)
    setHistory([])
    const queue = shuffle(FLAG_KEYS)
    queueRef.current = queue
    setScreen(SCREEN.PLAYING)
    setTimeout(() => loadFlag(queue[0]), 80)
  }

  function nextFlag() {
    const queue = queueRef.current.slice(1)
    queueRef.current = queue
    if (queue.length === 0) {
      setScreen(SCREEN.GAMEOVER)
      return
    }
    setScreen(SCREEN.PLAYING)
    setTimeout(() => loadFlag(queue[0]), 80)
  }

  function retryFlag() {
    undoStack.current = []
    loadFlag(currentKey)
  }

  // ── Undo helpers ──────────────────────────────────────────────────────────
  function saveUndo() {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current = [...undoStack.current.slice(-19), snapshot]  // max 20 steps
    setUndoCount(undoStack.current.length)
  }

  function undo() {
    if (undoStack.current.length === 0) return
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const last = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    ctx.putImageData(last, 0, 0)
    setUndoCount(undoStack.current.length)
  }

  // ── Pre-made shape stamps ─────────────────────────────────────────────────
  function stampShape(shape) {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    saveUndo()  // save before stamping so it can be undone
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = activeColor
    ctx.strokeStyle = activeColor

    switch (shape) {
      case 'h-stripe-top':
        ctx.fillRect(0, 0, W, Math.round(H / 3))
        break
      case 'h-stripe-mid':
        ctx.fillRect(0, Math.round(H / 3), W, Math.round(H / 3))
        break
      case 'h-stripe-bot':
        ctx.fillRect(0, Math.round(2 * H / 3), W, Math.round(H / 3))
        break
      case 'v-stripe-left':
        ctx.fillRect(0, 0, Math.round(W / 3), H)
        break
      case 'v-stripe-mid':
        ctx.fillRect(Math.round(W / 3), 0, Math.round(W / 3), H)
        break
      case 'v-stripe-right':
        ctx.fillRect(Math.round(2 * W / 3), 0, Math.round(W / 3), H)
        break
      case 'circle': {
        const cx = W / 2, cy = H / 2
        const r = Math.round(Math.min(W, H) * 0.22)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'cross-h':
        ctx.fillRect(0, Math.round(H * 0.38), W, Math.round(H * 0.24))
        break
      case 'cross-v':
        ctx.fillRect(Math.round(W * 0.38), 0, Math.round(W * 0.24), H)
        break
      case 'diag-left': {
        ctx.lineWidth = Math.round(Math.min(W, H) * 0.18)
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(W, H)
        ctx.stroke()
        break
      }
      case 'diag-right': {
        ctx.lineWidth = Math.round(Math.min(W, H) * 0.18)
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(W, 0)
        ctx.lineTo(0, H)
        ctx.stroke()
        break
      }
      case 'left-half':
        ctx.fillRect(0, 0, Math.round(W / 2), H)
        break
      case 'top-half':
        ctx.fillRect(0, 0, W, Math.round(H / 2))
        break
      default:
        break
    }
  }
  function validate() {
    const drawCanvas = drawingCanvasRef.current
    const refCanvas = refCanvasRef.current
    if (!drawCanvas || !refCanvas) return

    const W = drawCanvas.width, H = drawCanvas.height
    const snap = drawCanvas.toDataURL('image/png')

    const drawCtx = drawCanvas.getContext('2d')
    const refCtx = refCanvas.getContext('2d')
    const drawData = drawCtx.getImageData(0, 0, W, H)
    const refData = refCtx.getImageData(0, 0, W, H)

    const sim = comparePixels(drawData, refData)
    setScore(sim)

    const passed = sim >= 70
    const pts = passed ? calcPoints(sim, streakRef.current, difficulty) : 0
    let newTotal = totalScore
    if (passed) {
      newTotal = totalScore + pts
      setTotalScore(newTotal)
      streakRef.current++
      setStreak(streakRef.current)
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setSnapshotUrl(snap)
        saveDiffScore(difficulty, newTotal)
        setTimeout(() => setScreen(SCREEN.GAMEOVER), 1800)
        return
      }
    }
    setLastPts(passed ? pts : null)
    setHistory(prev => [...prev, { key: currentKey, score: sim, passed, pts }])
    setSnapshotUrl(snap)
    setScreen(SCREEN.RESULT)
  }

  // ── Canvas interaction ────────────────────────────────────────────────────
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: Math.round((cx - rect.left) * sx), y: Math.round((cy - rect.top) * sy) }
  }

  function handleDown(e) {
    e.preventDefault()
    if (score !== null || flagLoading) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)
    setIsDrawing(true)

    // Save snapshot before any action
    saveUndo()

    if (activeTool === TOOL.FILL) {
      const ctx = canvas.getContext('2d')
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      floodFill(imgData, canvas.width, canvas.height, pos.x, pos.y, activeColor)
      ctx.putImageData(imgData, 0, 0)
    } else if (activeTool === TOOL.BRUSH) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = activeColor
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize/2, 0, Math.PI*2)
      ctx.fill()
      setLineStart(pos)
    } else if (activeTool === TOOL.ERASER) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI*2)
      ctx.fill()
      setLineStart(pos)
    }
  }

  function handleMove(e) {
    e.preventDefault()
    if (!isDrawing || score !== null) return
    const canvas = drawingCanvasRef.current
    const pos = getPos(e, canvas)

    if (activeTool === TOOL.BRUSH && lineStart) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = activeColor
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lineStart.x, lineStart.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setLineStart(pos)
    } else if (activeTool === TOOL.ERASER && lineStart) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = brushSize * 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lineStart.x, lineStart.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setLineStart(pos)
    }
  }

  function handleUp(e) {
    e.preventDefault()
    setIsDrawing(false)
    setLineStart(null)
    const ov = overlayCanvasRef.current
    if (ov) ov.getContext('2d').clearRect(0, 0, ov.width, ov.height)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const colors = {
    bg: '#F4F1E6',
    navy: '#0B1F3B',
    accent: '#9EB7E5',
    green: '#426A5A',
    gold: '#806D40',
    card: '#FFFFFF',
    border: '#D9D5C9',
    muted: '#7A7568',
  }

  const def = currentKey ? FLAG_DEFS[currentKey] : null
  const flagName = def ? (locale === 'fr' ? def.fr : def.en) : ''

  // ── SETUP screen ──────────────────────────────────────────────────────────
  if (screen === SCREEN.SETUP) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Roboto', sans-serif" }}>
        <div style={{ background: colors.card, borderRadius: '20px', padding: '40px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(11,31,59,0.12)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: colors.navy, margin: 0, fontFamily: "'Roboto Slab', serif" }}>
              {t('Flag Drawing', 'Dessin de drapeaux')}
              <span style={{ fontSize: '12px', background: colors.navy, color: '#FFF', borderRadius: '6px', padding: '2px 8px', marginLeft: '10px', verticalAlign: 'middle', fontFamily: "'Roboto', sans-serif", fontWeight: 600 }}>v2</span>
            </h1>
            <p style={{ color: colors.muted, fontSize: '14px', marginTop: '8px' }}>
              {t('Colors auto-extracted from real flags', 'Couleurs extraites automatiquement des vrais drapeaux')}
            </p>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: colors.navy, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('Difficulty', 'Difficulté')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'easy',    icon: '🟢', en: 'Easy',    fr: 'Facile',    descEn: 'Lines + flag name shown', descFr: 'Lignes + nom du drapeau' },
                { key: 'medium',  icon: '🟡', en: 'Medium',  fr: 'Moyen',     descEn: 'Guide lines only',        descFr: 'Lignes guides seulement' },
                { key: 'hard',    icon: '🟠', en: 'Hard',    fr: 'Difficile', descEn: 'Blank canvas, no name',   descFr: 'Toile vierge, sans nom' },
                { key: 'extreme', icon: '🔴', en: 'Extreme', fr: 'Extrême',   descEn: 'Blank canvas, ×3 pts',    descFr: 'Toile vierge, ×3 pts' },
              ].map(d => {
                const best = diffStats[d.key]?.best
                return (
                  <button key={d.key} onClick={() => setDifficulty(d.key)} style={{
                    padding: '14px', borderRadius: '12px', border: difficulty === d.key ? `2px solid ${colors.navy}` : `2px solid ${colors.border}`,
                    background: difficulty === d.key ? colors.navy : '#FAFAF7',
                    color: difficulty === d.key ? '#FFF' : colors.navy,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{d.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{locale === 'fr' ? d.fr : d.en}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{locale === 'fr' ? d.descFr : d.descEn}</div>
                    {best > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '700', color: difficulty === d.key ? 'rgba(255,255,255,0.7)' : colors.muted }}>
                        ⭐ {t('Best:', 'Meilleur :')} {best}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={startGame} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: colors.navy, color: '#FFF', fontSize: '16px', fontWeight: '700',
            cursor: 'pointer', fontFamily: "'Roboto', sans-serif",
          }}>
            {t('Start', 'Commencer')} →
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING screen ────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING) {
    const canvasH = def ? Math.round(CANVAS_W / def.ratio) : 320
    const canvasDisplayW = isMobile ? Math.min(CANVAS_W, window.innerWidth - 32) : CANVAS_W
    const canvasDisplayH = def ? Math.round(canvasDisplayW / def.ratio) : 320

    return (
      <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Roboto', sans-serif", paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({length: MAX_LIVES}).map((_, i) => (
              <span key={i} style={{ fontSize: '22px', opacity: i < lives ? 1 : 0.25 }}>❤️</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {streak > 1 && <span style={{ fontSize: '13px', fontWeight: '700', color: '#E65C00' }}>🔥 {streak}</span>}
            <div style={{ background: colors.navy, color: '#FFF', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', fontWeight: '700' }}>
              ⭐ {totalScore}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '16px' }}>
          {/* Flag name */}
          {cfg.showName && flagName && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: colors.navy, margin: 0, fontFamily: "'Roboto Slab', serif" }}>{flagName}</h2>
            </div>
          )}

          {/* Canvas area */}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${colors.border}`, marginBottom: '16px',
            width: canvasDisplayW, height: canvasDisplayH, margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            cursor: activeTool === TOOL.FILL ? 'crosshair' : activeTool === TOOL.ERASER ? 'cell' : 'default',
            touchAction: 'none',
          }}>
            <canvas ref={drawingCanvasRef} width={CANVAS_W} height={canvasH}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp}
              onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
            />
            <canvas ref={overlayCanvasRef} width={CANVAS_W} height={canvasH}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            {flagLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,241,230,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', color: colors.muted, fontWeight: 600 }}>
                  {t('Analyzing flag…', 'Analyse du drapeau…')}
                </div>
              </div>
            )}
          </div>

          {/* Auto-extracted palette + custom color */}
          {palette.length > 0 && (
            <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                {t('Flag colors', 'Couleurs du drapeau')}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {palette.map(c => (
                  <button key={c.hex} onClick={() => { setActiveColor(c.hex); setActiveTool(TOOL.FILL) }} style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: c.hex, border: activeColor === c.hex ? `3px solid ${colors.navy}` : '2px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer', boxShadow: activeColor === c.hex ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${colors.navy}` : 'none',
                    transition: 'all 0.12s', transform: activeColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                  }} />
                ))}
                {/* Custom color picker */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => { setCustomColor(e.target.value); setActiveColor(e.target.value); setActiveTool(TOOL.FILL) }}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: activeColor === customColor && !palette.find(p => p.hex === customColor) ? `3px solid ${colors.navy}` : '2px solid rgba(0,0,0,0.15)', cursor: 'pointer', padding: '2px', background: 'none' }}
                    title={t('Custom color', 'Couleur personnalisée')}
                  />
                  <span style={{ fontSize: '10px', color: colors.muted, marginLeft: '4px', fontWeight: 600 }}>+</span>
                </div>
              </div>
            </div>
          )}

          {/* Tools */}
          <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[
                { key: TOOL.FILL,   icon: '🪣', label: t('Fill','Remplir')  },
                { key: TOOL.BRUSH,  icon: '✏️', label: t('Brush','Pinceau') },
                { key: TOOL.ERASER, icon: '🧹', label: t('Erase','Effacer') },
              ].map(tool => (
                <button key={tool.key} onClick={() => setActiveTool(tool.key)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: activeTool === tool.key ? `2px solid ${colors.navy}` : `2px solid ${colors.border}`,
                  background: activeTool === tool.key ? colors.navy : '#FAFAF7',
                  color: activeTool === tool.key ? '#FFF' : colors.navy,
                  fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>{tool.icon}</span>
                  {!isMobile && <span>{tool.label}</span>}
                </button>
              ))}
              {(activeTool === TOOL.BRUSH || activeTool === TOOL.ERASER) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '12px', color: colors.muted }}>Size</span>
                  <input type="range" min="2" max="30" value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ width: '80px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: colors.navy, minWidth: '20px' }}>{brushSize}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shape stamps */}
          <div style={{ background: colors.card, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {t('Shapes (stamped with current color)', 'Formes (couleur active)')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { key: 'h-stripe-top',  label: '▬ Top',        labelFr: '▬ Haut'        },
                { key: 'h-stripe-mid',  label: '▬ Middle',     labelFr: '▬ Milieu'       },
                { key: 'h-stripe-bot',  label: '▬ Bottom',     labelFr: '▬ Bas'          },
                { key: 'v-stripe-left', label: '◼ Left',        labelFr: '◼ Gauche'      },
                { key: 'v-stripe-mid',  label: '◼ Center',     labelFr: '◼ Centre'      },
                { key: 'v-stripe-right',label: '◼ Right',      labelFr: '◼ Droite'      },
                { key: 'left-half',     label: '◧ Left half',  labelFr: '◧ Moitié G'    },
                { key: 'top-half',      label: '⬒ Top half',   labelFr: '⬒ Moitié H'    },
                { key: 'circle',        label: '⭕ Circle',     labelFr: '⭕ Cercle'      },
                { key: 'cross-h',       label: '— H-Cross',    labelFr: '— Croix H'     },
                { key: 'cross-v',       label: '| V-Cross',    labelFr: '| Croix V'     },
                { key: 'diag-left',     label: '╲ Diag',       labelFr: '╲ Diag'        },
                { key: 'diag-right',    label: '╱ Diag',       labelFr: '╱ Diag'        },
              ].map(s => (
                <button key={s.key} onClick={() => stampShape(s.key)} style={{
                  padding: '5px 10px', borderRadius: '7px', border: `1.5px solid ${colors.border}`,
                  background: '#FAFAF7', color: colors.navy, fontSize: '11px', fontWeight: '600',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = colors.navy; e.currentTarget.style.color = '#FFF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF7'; e.currentTarget.style.color = colors.navy }}>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', background: activeColor, borderRadius: '2px', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                  {locale === 'fr' ? s.labelFr : s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={retryFlag} title={t('Reset all', 'Tout réinitialiser')} style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: `2px solid ${colors.border}`,
              background: '#FAFAF7', color: colors.navy, fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            }}>
              {t('Reset', 'Reset')} ↺
            </button>
            <button
              onClick={undo}
              disabled={undoCount === 0}
              title={t('Undo last action', 'Annuler la dernière action')}
              style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: `2px solid ${undoCount > 0 ? '#9EB7E5' : colors.border}`,
                background: undoCount > 0 ? '#EEF4FF' : '#FAFAF7',
                color: undoCount > 0 ? '#0B1F3B' : '#B0A89E',
                fontWeight: '700', fontSize: '14px',
                cursor: undoCount > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
              ↩ {t('Undo', 'Annuler')}
            </button>
            <button onClick={validate} disabled={flagLoading} style={{
              flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
              background: flagLoading ? colors.border : colors.navy,
              color: '#FFF', fontWeight: '700', fontSize: '14px', cursor: flagLoading ? 'default' : 'pointer',
            }}>
              {t('Validate', 'Valider')} ✓
            </button>
          </div>
        </div>
        <canvas ref={refCanvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // ── RESULT screen ─────────────────────────────────────────────────────────
  if (screen === SCREEN.RESULT) {
    const passed = score >= 70
    const scoreColor = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626'
    const canvasH = def ? Math.round(CANVAS_W / def.ratio) : 320

    return (
      <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Roboto', sans-serif", padding: '24px 16px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          {/* Score card */}
          <div style={{ background: colors.card, borderRadius: '20px', padding: '32px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 20px rgba(11,31,59,0.1)' }}>
            <div style={{ fontSize: '44px', marginBottom: '8px' }}>{score >= 90 ? '🏆' : score >= 70 ? '🎯' : '💪'}</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: colors.navy, margin: '0 0 8px', fontFamily: "'Roboto Slab', serif" }}>{flagName}</h2>
            <div style={{ fontSize: '52px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{score}%</div>
            {passed && lastPts && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: colors.navy, color: '#FFF', borderRadius: '20px', padding: '8px 18px', marginTop: '12px', fontWeight: '700', fontSize: '15px' }}>
                ⭐ +{lastPts} pts
              </div>
            )}
            <div style={{ fontSize: '14px', color: colors.muted, marginTop: '10px' }}>
              {passed ? t('Great job! Flag validated ✓', 'Bravo ! Drapeau validé ✓') : t('Keep trying! Aim for 70%+', 'Continue ! Vise 70%+')}
            </div>
          </div>

          {/* Side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: t('YOUR DRAWING', 'VOTRE DESSIN'), src: snapshotUrl, isImg: true },
              { label: t('REAL FLAG', 'VRAI DRAPEAU'), src: `https://flagcdn.com/w320/${currentKey}.png`, isImg: true },
            ].map((panel, i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{panel.label}</div>
                <img src={panel.src} alt={panel.label} style={{ width: '100%', borderRadius: '10px', border: `2px solid ${colors.border}`, display: 'block' }} />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!passed && lives > 0 && (
              <button onClick={() => { setScore(null); setScreen(SCREEN.PLAYING); retryFlag() }} style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: `2px solid ${colors.border}`,
                background: '#FAFAF7', color: colors.navy, fontWeight: '700', fontSize: '15px', cursor: 'pointer',
              }}>
                {t('Retry', 'Réessayer')} ↺
              </button>
            )}
            <button onClick={nextFlag} style={{
              flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
              background: colors.navy, color: '#FFF', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
            }}>
              {t('Next flag', 'Drapeau suivant')} →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GAMEOVER screen ───────────────────────────────────────────────────────
  const passed = history.filter(h => h.passed).length
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Roboto', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: colors.card, borderRadius: '20px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(11,31,59,0.12)' }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏁</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: colors.navy, margin: '0 0 8px', fontFamily: "'Roboto Slab', serif" }}>
          {t('Game Over', 'Partie terminée')}
        </h2>
        <div style={{ fontSize: '42px', fontWeight: '900', color: colors.navy, margin: '8px 0' }}>⭐ {totalScore}</div>
        <div style={{ color: colors.muted, fontSize: '15px', marginBottom: '28px' }}>
          {passed}/{history.length} {t('flags validated', 'drapeaux validés')}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '24px', textAlign: 'left' }}>
            {history.map((h, i) => {
              const hDef = FLAG_DEFS[h.key]
              const hName = hDef ? (locale === 'fr' ? hDef.fr : hDef.en) : h.key
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                  <img src={`https://flagcdn.com/w80/${h.key}.png`} alt="" style={{ width: '36px', height: '24px', objectFit: 'contain', borderRadius: '3px', border: `1px solid ${colors.border}` }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: colors.navy }}>{hName}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: h.passed ? '#16a34a' : '#dc2626' }}>{h.score}%</span>
                  {h.passed && <span style={{ fontSize: '12px', color: colors.muted }}>+{h.pts}</span>}
                </div>
              )
            })}
          </div>
        )}

        <button onClick={() => setScreen(SCREEN.SETUP)} style={{
          width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
          background: colors.navy, color: '#FFF', fontSize: '16px', fontWeight: '700',
          cursor: 'pointer', fontFamily: "'Roboto', sans-serif",
        }}>
          {t('Play again', 'Rejouer')}
        </button>
      </div>
    </div>
  )
}