"use client"

import { Box, Clock, Truck, User, Wrench } from "lucide-react"

export function RecentActivities() {
  // Sample data for recent activities
  const activities = [
    {
      id: 1,
      type: "movement",
      asset: "Laptop Dell XPS 15",
      from: "IT Department",
      to: "Marketing Department",
      user: "John Smith",
      timestamp: "Today, 10:23 AM",
      icon: Truck,
    },
    {
      id: 2,
      type: "maintenance",
      asset: "Printer HP LaserJet Pro",
      description: "Routine maintenance completed",
      user: "Tech Support",
      timestamp: "Today, 9:15 AM",
      icon: Wrench,
    },
    {
      id: 3,
      type: "assignment",
      asset: "MacBook Pro M1",
      user: "Sarah Johnson",
      timestamp: "Yesterday, 4:30 PM",
      icon: User,
    },
    {
      id: 4,
      type: "check-in",
      asset: "Projector Epson EB-U05",
      location: "Conference Room B",
      user: "Meeting Coordinator",
      timestamp: "Yesterday, 2:45 PM",
      icon: Box,
    },
    {
      id: 5,
      type: "scheduled",
      asset: "HVAC System",
      description: "Maintenance scheduled",
      date: "March 20, 2025",
      timestamp: "Yesterday, 11:20 AM",
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm p-3 hover:bg-white/10 transition-all duration-200">
          <div className="rounded-full bg-white/10 p-2 border border-white/20">
            <activity.icon className="h-4 w-4 text-teal-400" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{activity.asset}</p>
              <span className="text-xs text-white/70">{activity.timestamp}</span>
            </div>
            <p className="text-sm text-white/80">
              {activity.type === "movement" && (
                <>
                  Moved from {activity.from} to {activity.to} by {activity.user}
                </>
              )}
              {activity.type === "maintenance" && (
                <>
                  {activity.description} by {activity.user}
                </>
              )}
              {activity.type === "assignment" && <>Assigned to {activity.user}</>}
              {activity.type === "check-in" && (
                <>
                  Checked in at {activity.location} by {activity.user}
                </>
              )}
              {activity.type === "scheduled" && (
                <>
                  {activity.description} for {activity.date}
                </>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

