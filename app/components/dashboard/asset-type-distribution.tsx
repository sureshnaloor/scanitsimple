"use client"

import { useEffect, useRef, useCallback } from "react"

export interface AssetTypeSlice {
  label: string
  value: number
}

const DEFAULT_COLORS = ["#00B4D8", "#FF6B35", "#10B981", "#F59E0B", "#0077B6", "#64748B", "#EF4444", "#94A3B8"]

interface AssetTypeDistributionProps {
  segments: AssetTypeSlice[]
  theme?: "light" | "dark" | "glassmorphic"
}

export function AssetTypeDistribution({ segments, theme = "dark" }: AssetTypeDistributionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const hoverRef = useRef<number>(-1)

  const draw = useCallback((progress = 1, hoveredIndex = -1) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    const legendMuted =
      theme === "light" ? "#475569" : theme === "glassmorphic" ? "rgba(255,255,255,0.85)" : "#94a3b8"

    const data =
      segments?.filter((s) => s.value > 0).map((s, i) => ({
        label: s.label || "Unknown",
        value: s.value,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      })) ?? []

    /* ── Layout: legend on left, chart on right ── */
    const padding = 16
    const legendWidth = 160
    const chartCenterX = legendWidth + (rect.width - legendWidth) / 2 + 20
    const centerY = rect.height / 2
    const outerRadius = Math.min((rect.width - legendWidth) / 2, centerY) - 30
    const innerRadius = outerRadius * 0.55

    if (data.length === 0) {
      ctx.fillStyle = legendMuted
      ctx.font = "500 14px ui-sans-serif, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No category data yet", rect.width / 2, centerY)
      return
    }

    const total = data.reduce((sum, item) => sum + item.value, 0)
    let startAngle = -Math.PI / 2 - (Math.PI * 2 * (1 - progress))

    /* ── Draw donut ── */
    data.forEach((item, idx) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI * progress
      const isHovered = idx === hoveredIndex
      const radiusOffset = isHovered ? 5 : 0

      ctx.beginPath()
      ctx.arc(chartCenterX, centerY, outerRadius + radiusOffset, startAngle, startAngle + sliceAngle)
      ctx.arc(chartCenterX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // Separator
      ctx.beginPath()
      ctx.arc(chartCenterX, centerY, outerRadius + radiusOffset + 1, startAngle, startAngle + sliceAngle)
      ctx.strokeStyle = theme === "light" ? "#F1F5F9" : "#0B1120"
      ctx.lineWidth = 2
      ctx.stroke()

      startAngle += sliceAngle
    })

    /* ── Center text ── */
    ctx.fillStyle = theme === "light" ? "#0F172A" : "#F8F9FA"
    ctx.font = "700 16px ui-sans-serif, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(total.toLocaleString()), chartCenterX, centerY - 5)
    ctx.font = "500 10px ui-sans-serif, system-ui, sans-serif"
    ctx.fillStyle = legendMuted
    ctx.fillText("Total Assets", chartCenterX, centerY + 12)

    /* ── Legend (left side, vertically centered) ── */
    const legendX = padding
    const lineHeight = 24
    const totalLegendHeight = data.length * lineHeight
    let legendY = centerY - totalLegendHeight / 2 + lineHeight / 2

    data.forEach((item, idx) => {
      const isHovered = idx === hoveredIndex
      const pct = Math.round((item.value / total) * 100)

      // Color swatch
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.roundRect(legendX, legendY - 6, 10, 10, 2)
      ctx.fill()

      // Label
      ctx.fillStyle = isHovered ? (theme === "light" ? "#0F172A" : "#F8F9FA") : legendMuted
      ctx.font = isHovered
        ? "600 12px ui-sans-serif, system-ui, sans-serif"
        : "500 12px ui-sans-serif, system-ui, sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(`${item.label} · ${pct}%`, legendX + 18, legendY)

      legendY += lineHeight
    })
  }, [segments, theme])

  // Entry animation
  useEffect(() => {
    const start = performance.now()
    const duration = 1200

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      draw(eased, hoverRef.current)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  // Handle hover — detect using right-side chart center
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !segments?.length) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const padding = 16
    const legendWidth = 160
    const chartCenterX = legendWidth + (rect.width - legendWidth) / 2 + 20
    const centerY = rect.height / 2
    const dx = x - chartCenterX
    const dy = y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const outerRadius = Math.min((rect.width - legendWidth) / 2, centerY) - 30
    const innerRadius = outerRadius * 0.55

    if (dist < innerRadius || dist > outerRadius + 6) {
      hoverRef.current = -1
    } else {
      let angle = Math.atan2(dy, dx)
      if (angle < -Math.PI / 2) angle += Math.PI * 2
      angle += Math.PI / 2
      if (angle < 0) angle += Math.PI * 2

      const data = segments.filter((s) => s.value > 0)
      const total = data.reduce((sum, s) => sum + s.value, 0)
      let currentAngle = 0
      for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i].value / total) * Math.PI * 2
        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
          hoverRef.current = i
          break
        }
        currentAngle += sliceAngle
      }
    }
    draw(1, hoverRef.current)
  }

  const handleMouseLeave = () => {
    hoverRef.current = -1
    draw(1, -1)
  }

  return (
    <div className="h-[280px] w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        aria-label="Asset type distribution chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
