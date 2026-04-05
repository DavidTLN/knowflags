'use client'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

export default function Debug() {
  const canvasRef = useRef(null)
  const [log, setLog] = useState([])

  const addLog = (msg) => setLog(p => [...p, msg])

  useEffect(() => {
    const canvas = canvasRef.current
    addLog(`canvas: ${canvas ? 'found' : 'null'}`)
    if (!canvas) return

    const W = 600, H = 400
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Draw background
    ctx.fillStyle = '#eee'
    ctx.fillRect(0, 0, W, H)
    addLog('background drawn')

    // Load topo
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        addLog('topo loaded')
        const features = topojson.feature(world, world.objects.countries).features
        addLog(`features: ${features.length}`)

        // Find France (id=250)
        const france = features.find(f => parseInt(f.id) === 250)
        addLog(`france: ${france ? 'found' : 'NOT FOUND'}`)
        if (!france) return

        const proj = d3.geoMercator()
          .scale((256 / (2 * Math.PI)) * Math.pow(2, 2))
          .center([0, 20])
          .translate([W/2, H/2])

        const centroid = d3.geoCentroid(france)
        addLog(`centroid: [${centroid[0].toFixed(1)}, ${centroid[1].toFixed(1)}]`)
        const px = proj(centroid)
        addLog(`pixel: [${px[0].toFixed(0)}, ${px[1].toFixed(0)}]`)

        const pathGen = d3.geoPath().projection(proj).context(ctx)

        ctx.beginPath()
        pathGen(france)
        ctx.fillStyle = 'rgba(230,57,70,0.6)'
        ctx.fill()
        ctx.strokeStyle = '#E63946'
        ctx.lineWidth = 1
        ctx.stroke()
        addLog('france drawn!')

        // Dot at centroid
        ctx.beginPath()
        ctx.arc(px[0], px[1], 5, 0, Math.PI*2)
        ctx.fillStyle = 'blue'
        ctx.fill()
        addLog('centroid dot drawn')
      })
      .catch(e => addLog(`ERROR: ${e.message}`))
  }, [])

  return (
    <div style={{padding:20}}>
      <h2>Canvas Debug</h2>
      <canvas ref={canvasRef} style={{border:'2px solid black', display:'block'}} />
      <div style={{marginTop:10, fontFamily:'monospace', fontSize:12}}>
        {log.map((l,i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
