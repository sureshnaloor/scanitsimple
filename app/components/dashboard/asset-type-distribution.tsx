"use client"

import { useEffect, useRef } from "react"

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

  useEffect(() => {
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
      theme === "light" ? "#475569" : theme === "glassmorphic" ? "rgba(255,255,255,0.85)" : "#cbd5e1"

    const data =
      segments?.filter((s) => s.value > 0).map((s, i) => ({
        label: s.label || "Unknown",
        value: s.value,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      })) ?? []

    const centerX = rect.width / 2
    const centerY = rect.height / 2 - 8
    const radius = Math.min(centerX, centerY) - 36

    if (data.length === 0) {
      ctx.fillStyle = legendMuted
      ctx.font = "500 14px ui-sans-serif, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No category data yet", centerX, centerY)
      return
    }

    const total = data.reduce((sum, item) => sum + item.value, 0)
    let startAngle = -Math.PI / 2

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      if (sliceAngle > 0.15) {
        const middleAngle = startAngle + sliceAngle / 2
        const labelRadius = radius * 0.62
        const labelX = centerX + labelRadius * Math.cos(middleAngle)
        const labelY = centerY + labelRadius * Math.sin(middleAngle)
        ctx.fillStyle = "rgba(255,255,255,0.95)"
        ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${Math.round((item.value / total) * 100)}%`, labelX, labelY)
      }

      startAngle += sliceAngle
    })

    const legendX = 12
    let legendY = Math.min(rect.height - data.length * 22 - 12, centerY + radius + 14)

    data.forEach((item) => {
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, legendY, 12, 12)
      ctx.fillStyle = legendMuted
      ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      const pct = Math.round((item.value / total) * 100)
      ctx.fillText(`${item.label} · ${pct}%`, legendX + 18, legendY + 6)
      legendY += 22
    })
  }, [segments, theme])

  return (
    <div className="h-[300px] w-full">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Asset type distribution chart" />
    </div>
  )
}
