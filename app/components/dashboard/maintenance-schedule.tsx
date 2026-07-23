"use client"

import { CalendarClock, CheckCircle, Clock, Wrench } from "lucide-react"

export interface CalibrationScheduleItem {
  id: string
  asset: string
  subtitle: string
  dateLabel: string
  status: "scheduled" | "pending" | "completed"
}

interface MaintenanceScheduleProps {
  items: CalibrationScheduleItem[]
  titleClass?: string
  mutedClass?: string
  borderClass?: string
  rowBgClass?: string
  emptyMessage?: string
}

export function MaintenanceSchedule({
  items,
  titleClass = "text-sm font-medium text-white",
  mutedClass = "text-sm text-white/80",
  borderClass = "border-white/20",
  rowBgClass = "border-white/20 bg-white/5 backdrop-blur-sm",
  emptyMessage = "No upcoming calibration expiries in the dataset.",
}: MaintenanceScheduleProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "scheduled":
        return <CalendarClock className="h-4 w-4 text-sky-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Wrench className="h-4 w-4 text-slate-400" />
    }
  }

  if (!items.length) {
    return (
      <p className={`rounded-xl border ${borderClass} ${rowBgClass} px-4 py-6 text-center text-sm ${mutedClass}`}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 rounded-xl border ${borderClass} ${rowBgClass} p-3 transition-colors`}
        >
          <div className={`rounded-full border ${borderClass} bg-white/10 p-2`}>{getStatusIcon(item.status)}</div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`truncate ${titleClass}`}>{item.asset}</p>
              <span className={`shrink-0 text-xs ${mutedClass}`}>{item.dateLabel}</span>
            </div>
            <p className={mutedClass}>{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
