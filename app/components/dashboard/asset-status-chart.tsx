"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

export interface AssetStatusDatum {
  name: string
  value: number
}

const DEFAULT_PALETTE = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#64748b"]

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

  return (
    <div className="w-full" style={{ minHeight: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: axisStroke, fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={56} />
          <YAxis tick={{ fill: axisStroke, fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Assets">
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  !data?.length
                    ? "#94a3b8"
                    : DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
