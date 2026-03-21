"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface AnalyticsData {
  byStage: { name: string; value: number }[]
  byClub: { name: string; value: number }[]
  dailyTrend: { date: string; fullDate: string; count: number }[]
  security: { checkedIn: number; checkedOut: number; unchecked: number }
  totalInRange: number
}

const STAGE_COLORS: Record<string, string> = {
  "TEAM LEAD PENDING": "#f59e0b",
  "STAFF PENDING": "#3b82f6",
  "WARDEN PENDING": "#8b5cf6",
  "COMPLETED": "#22c55e",
  "REJECTED": "#ef4444",
}

const CLUB_COLORS = ["#6366f1", "#f43f5e", "#14b8a6", "#f97316", "#06b6d4", "#8b5cf6", "#ec4899"]

const RANGE_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "1 Month", value: 30 },
  { label: "3 Months", value: 90 },
]

export default function DashboardCharts({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72" />
        {!compact && <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-56" /><Skeleton className="h-56" /><Skeleton className="h-56" /></div>}
      </div>
    )
  }

  if (!data) return null

  // Large Area Chart - Daily Request Trend
  const areaOption = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const, label: { backgroundColor: "#6366f1" } },
      formatter: (params: any) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>Requests: <strong>${p.value}</strong>`
      },
    },
    xAxis: {
      type: "category" as const,
      boundaryGap: false,
      data: (data.dailyTrend || []).map((d: any) => d.date),
      axisLabel: { fontSize: 11, rotate: days > 30 ? 45 : 0 },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11 },
      minInterval: 1,
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        name: "Requests",
        type: "line",
        smooth: true,
        data: (data.dailyTrend || []).map((d: any) => d.count),
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(99, 102, 241, 0.35)" },
              { offset: 1, color: "rgba(99, 102, 241, 0.02)" },
            ],
          },
        },
        lineStyle: { width: 2.5, color: "#6366f1" },
        itemStyle: { color: "#6366f1" },
        symbol: days <= 14 ? "circle" : "none",
        symbolSize: 6,
      },
    ],
    grid: { left: "4%", right: "4%", bottom: days > 30 ? "18%" : "10%", top: "8%", containLabel: true },
  }

  // Stage Distribution Pie
  const stageOption = {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } },
      data: data.byStage.map((s) => ({
        ...s,
        itemStyle: { color: STAGE_COLORS[s.name] || "#94a3b8" },
      })),
    }],
  }

  // Club Bar Chart
  const clubOption = {
    tooltip: { trigger: "axis" as const },
    xAxis: {
      type: "category" as const,
      data: data.byClub.map((c) => c.name),
      axisLabel: { fontSize: 10, rotate: 20 },
    },
    yAxis: { type: "value" as const, axisLabel: { fontSize: 10 }, minInterval: 1 },
    series: [{
      type: "bar",
      data: data.byClub.map((c, i) => ({
        value: c.value,
        itemStyle: { color: CLUB_COLORS[i % CLUB_COLORS.length], borderRadius: [4, 4, 0, 0] },
      })),
      barWidth: "60%",
    }],
    grid: { left: "10%", right: "5%", bottom: "15%", top: "10%" },
  }

  // Security Donut
  const securityOption = {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    series: [{
      type: "pie",
      radius: ["45%", "72%"],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } },
      data: [
        { name: "Checked In", value: data.security.checkedIn, itemStyle: { color: "#22c55e" } },
        { name: "Checked Out", value: data.security.checkedOut, itemStyle: { color: "#3b82f6" } },
        { name: "Unchecked", value: data.security.unchecked, itemStyle: { color: "#94a3b8" } },
      ],
    }],
  }

  return (
    <div className="space-y-4">
      {/* Large Area Chart with Range Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Request Trends</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.totalInRange} total request{data.totalInRange !== 1 ? "s" : ""} in the last {days} day{days !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={days === opt.value ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setDays(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <ReactECharts option={areaOption} style={{ height: 280 }} />
          )}
        </CardContent>
      </Card>

      {/* Smaller charts row */}
      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By Stage</CardTitle></CardHeader>
            <CardContent><ReactECharts option={stageOption} style={{ height: 220 }} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By Club</CardTitle></CardHeader>
            <CardContent><ReactECharts option={clubOption} style={{ height: 220 }} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Security Checks</CardTitle></CardHeader>
            <CardContent><ReactECharts option={securityOption} style={{ height: 220 }} /></CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By Stage</CardTitle></CardHeader>
            <CardContent><ReactECharts option={stageOption} style={{ height: 200 }} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By Club</CardTitle></CardHeader>
            <CardContent><ReactECharts option={clubOption} style={{ height: 200 }} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
