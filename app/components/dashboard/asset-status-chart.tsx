"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

export interface AssetStatusDatum {
  name: string
  value: number
}

const DEFAULT_PALETTE = [
  { from: "#00B4D8", to: "#0077B6" },
  { from: "#FF6B35", to: "#E85D04" },
  { from: "#10B981", to: "#059669" },
  { from: "#F59E0B", to: "#D97706" },
  { from: "#6366F1", to: "#4F46E5" },
  { from: "#EF4444", to: "#DC2626" },
  { from: "#64748B", to: "#475569" },
]

interface AssetStatusChartProps {
  data: AssetStatusDatum[]
  gridStroke?: string
  axisStroke?: string
  emptyLabel?: string
}

export function AssetStatusChart({
  data,
  gridStroke = "#33415555",
  axisStroke = "#64748b",
  emptyLabel = "No status data yet",
}: AssetStatusChartProps) {
  const chartData = data?.length ? data : [{ name: emptyLabel, value: 0 }]
  const hasData = data?.length > 0

  return (
    <div className="w-full" style={{ minHeight: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            {DEFAULT_PALETTE.map((grad, i) => (
              <linearGradient key={i} id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={grad.from} />
                <stop offset="100%" stopColor={grad.to} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: axisStroke, fontSize: 12 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis tick={{ fill: axisStroke, fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
              fontSize: 13,
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
            }}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            name="Assets"
            animationBegin={100}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  !hasData
                    ? "#94a3b8"
                    : `url(#barGradient${i % DEFAULT_PALETTE.length})`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
