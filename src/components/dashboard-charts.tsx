"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import * as d3 from "d3"

// Define interfaces for analytics data
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

  // Refs for D3 containers
  const trendChartRef = useRef<HTMLDivElement>(null)
  const stageChartRef = useRef<HTMLDivElement>(null)
  const clubChartRef = useRef<HTMLDivElement>(null)
  const securityChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  // D3 Chart Rendering logic runs whenever `data` or `compact` changes
  useEffect(() => {
    if (!data) return

    // Clean up previous charts
    d3.select(trendChartRef.current).selectAll("*").remove()
    d3.select(stageChartRef.current).selectAll("*").remove()
    d3.select(clubChartRef.current).selectAll("*").remove()
    d3.select(securityChartRef.current).selectAll("*").remove()

    // Configuration
    const margin = { top: 20, right: 30, bottom: 40, left: 40 }
    const textColor = "#64748b" // slate-500
    const lineColor = "#e2e8f0" // slate-200
    
    // --- 1. Area Chart (Trend) ---
    if (trendChartRef.current && data.dailyTrend && data.dailyTrend.length > 0) {
      const parentWidth = trendChartRef.current.clientWidth
      const parentHeight = 280
      const width = parentWidth - margin.left - margin.right
      const height = parentHeight - margin.top - margin.bottom

      const svg = d3.select(trendChartRef.current)
        .append("svg")
        .attr("width", parentWidth)
        .attr("height", parentHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

      const x = d3.scalePoint()
        .domain(data.dailyTrend.map(d => d.date))
        .range([0, width])
        .padding(0.5)

      const y = d3.scaleLinear()
        .domain([0, d3.max(data.dailyTrend, d => d.count) || 5])
        .nice()
        .range([height, 0])

      // Add horizontal grid lines
      svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ""))
        .selectAll("line")
        .attr("stroke", lineColor)
        .attr("stroke-dasharray", "3,3")
      svg.select(".domain").remove() // remove y axis spine

      // X Axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(5))
        .selectAll("text")
        .attr("font-size", "11px")
        .attr("fill", textColor)
        .style("text-anchor", days > 30 ? "end" : "middle")
        .attr("dx", days > 30 ? "-.8em" : "0")
        .attr("dy", days > 30 ? ".15em" : ".71em")
        .attr("transform", days > 30 ? "rotate(-45)" : "rotate(0)")
      
      svg.select(".domain").attr("stroke", lineColor)

      // Y Axis
      svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")).tickSize(0))
        .selectAll("text")
        .attr("font-size", "11px")
        .attr("fill", textColor)
        .attr("dy", "-3px")

      // Line and Area generator
      const line = d3.line<any>()
        .x(d => x(d.date)!)
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX)

      const area = d3.area<any>()
        .x(d => x(d.date)!)
        .y0(height)
        .y1(d => y(d.count))
        .curve(d3.curveMonotoneX)

      // Area gradient
      const defs = svg.append("defs")
      const gradient = defs.append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%")
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#6366f1")
        .attr("stop-opacity", 0.35)
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#6366f1")
        .attr("stop-opacity", 0.02)

      // Add Area
      svg.append("path")
        .datum(data.dailyTrend)
        .attr("fill", "url(#area-gradient)")
        .attr("d", area)

      // Add Line
      svg.append("path")
        .datum(data.dailyTrend)
        .attr("fill", "none")
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 2.5)
        .attr("d", line)

      // Add Value Labels on top of the points (if days <= 14)
      if (days <= 14) {
        svg.selectAll(".dot")
          .data(data.dailyTrend)
          .join("circle")
          .attr("cx", d => x(d.date)!)
          .attr("cy", d => y(d.count))
          .attr("r", 4)
          .attr("fill", "#fff")
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 2)
          
        svg.selectAll(".label")
          .data(data.dailyTrend)
          .join("text")
          .attr("x", d => x(d.date)!)
          .attr("y", d => y(d.count) - 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", textColor)
          .text(d => d.count > 0 ? d.count : "")
      }
    }

    // PIE/DONUT CHART CONSTANTS
    const pieSize = compact ? 200 : 250
    const pieRadius = Math.min(pieSize, pieSize) / 2 - 20

    // Helper for pie legends
    const drawLegend = (svg: any, dataItems: any[], colorScale: (name: string) => string, xOffset: number) => {
      const legend = svg.selectAll(".legend")
        .data(dataItems)
        .join("g")
        .attr("transform", (d: any, i: number) => `translate(${xOffset},${-pieRadius + i * 16})`)

      legend.append("rect")
        .attr("width", 10).attr("height", 10).attr("rx", 2)
        .attr("fill", (d: any) => colorScale(d.name))
        
      legend.append("text")
        .attr("x", 16).attr("y", 8)
        .attr("font-size", "10px").attr("fill", textColor)
        .text((d: any) => `${d.name.replace("_", " ")} (${d.value})`)
    }

    // --- 2. Stage Pie Chart ---
    if (stageChartRef.current && data.byStage) {
      const svg = d3.select(stageChartRef.current)
        .append("svg")
        .attr("width", compact ? pieSize : pieSize + 100) // extra space for legend
        .attr("height", pieSize)
        .append("g")
        .attr("transform", `translate(${pieSize / 2},${pieSize / 2})`)

      const pie = d3.pie<any>().value(d => d.value).sort(null)
      const totalVal = d3.sum(data.byStage, d => (d as any).value)
      
      const renderData = totalVal === 0 
        ? [{ data: { name: "No Data", value: 1 }, value: 1, startAngle: 0, endAngle: Math.PI * 2, padAngle: 0, index: 0 }]
        : pie(data.byStage)

      const arc = d3.arc<any>().innerRadius(0).outerRadius(pieRadius)

      // Draw Pie slices
      svg.selectAll("path")
        .data(renderData)
        .join("path")
        .attr("d", arc)
        .attr("fill", d => totalVal === 0 ? "#f1f5f9" : (STAGE_COLORS[d.data.name] || "#94a3b8"))
        .attr("stroke", "#ffffff")
        .style("stroke-width", "2px")

      // Add Legend if not compact and has data
      if (totalVal > 0 && !compact) {
        drawLegend(svg, data.byStage, name => STAGE_COLORS[name] || "#94a3b8", pieRadius + 10)
      } else if (totalVal === 0) {
        svg.append("text").attr("text-anchor", "middle").attr("y", 4).attr("font-size", "12px").attr("fill", textColor).text("No Data Yet")
      }
    }

    // --- 3. Club Bar Chart ---
    if (clubChartRef.current && data.byClub) {
      const parentWidth = clubChartRef.current.clientWidth
      const parentHeight = compact ? 200 : 250
      const width = parentWidth - margin.left - margin.right
      const height = parentHeight - margin.top - margin.bottom

      const svg = d3.select(clubChartRef.current)
        .append("svg")
        .attr("width", parentWidth)
        .attr("height", parentHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

      const x = d3.scaleBand()
        .domain(data.byClub.map(d => d.name))
        .range([0, width])
        .padding(0.4)

      const y = d3.scaleLinear()
        .domain([0, d3.max(data.byClub, d => d.value) || 5])
        .nice()
        .range([height, 0])

      // Grid lines
      svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(() => ""))
        .selectAll("line").attr("stroke", lineColor).attr("stroke-dasharray", "3,3")
      svg.select(".domain").remove()

      // X Axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", textColor)
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        .attr("dy", "5px")
        .text((d: any) => d.length > 10 ? d.substring(0, 10) + "..." : d)
      svg.select(".domain").attr("stroke", lineColor)

      // Y Axis
      svg.append("g")
        .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")).tickSize(0))
        .selectAll("text").attr("font-size", "10px").attr("fill", textColor)

      // Bars
      svg.selectAll("rect.bar")
        .data(data.byClub)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.name)!)
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", (d, i) => CLUB_COLORS[i % CLUB_COLORS.length])
        .attr("rx", 3)
        
      // Bar labels (values on top of bars)
      svg.selectAll("text.val")
        .data(data.byClub)
        .join("text")
        .attr("class", "val")
        .attr("x", d => x(d.name)! + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", textColor)
        .text(d => d.value > 0 ? d.value : "")
    }

    // --- 4. Security Donut Chart ---
    if (securityChartRef.current && data.security) {
      const securityArray = [
        { name: "Checked In", value: data.security?.checkedIn ?? 0, color: "#22c55e" },
        { name: "Checked Out", value: data.security?.checkedOut ?? 0, color: "#3b82f6" },
        { name: "Unchecked", value: data.security?.unchecked ?? 0, color: "#cbd5e1" },
      ]

      const svg = d3.select(securityChartRef.current)
        .append("svg")
        .attr("width", compact ? pieSize : pieSize + 110)
        .attr("height", pieSize)
        .append("g")
        .attr("transform", `translate(${pieSize / 2},${pieSize / 2})`)

      const pie = d3.pie<any>().value(d => d.value).sort(null)
      const totalSec = d3.sum(securityArray, d => (d as any).value)

      const renderData = totalSec === 0
        ? [{ data: { name: "No Data", value: 1, color: "#f1f5f9" }, value: 1, startAngle: 0, endAngle: Math.PI * 2, padAngle: 0, index: 0 }]
        : pie(securityArray)

      const arc = d3.arc<any>().innerRadius(0).outerRadius(pieRadius)

      // Draw Pie
      svg.selectAll("path")
        .data(renderData)
        .join("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#ffffff")
        .style("stroke-width", "2px")

      // Add Legend if not compact and has data
      if (totalSec > 0 && !compact) {
        drawLegend(svg, securityArray, name => securityArray.find(s => s.name === name)?.color || "#000", pieRadius + 10)
      } else if (totalSec === 0) {
        svg.append("text").attr("text-anchor", "middle").attr("y", 4).attr("font-size", "12px").attr("fill", textColor).text("No Completed Requests")
      }
    }

    // Handle window resize dynamically to re-draw
    const handleResize = () => {
      // Small trigger to re-render component basically effectively re-drawing
      // This is basic D3 responsive setup without full heavy hooks
      setDays(prev => prev)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)

  }, [data, compact, days])

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72" />
        {!compact && <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-56" /><Skeleton className="h-56" /><Skeleton className="h-56" /></div>}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Large Area Chart with Range Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-light">Request Trends</CardTitle>
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
                className="h-7 text-xs px-2.5 font-light"
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
            <div ref={trendChartRef} className="w-full h-[280px]" />
          )}
        </CardContent>
      </Card>

      {/* Smaller charts row */}
      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-light">By Stage</CardTitle></CardHeader>
            <CardContent className="flex justify-center items-center"><div ref={stageChartRef} className="h-[220px]" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-light">By Club</CardTitle></CardHeader>
            <CardContent><div ref={clubChartRef} className="w-full h-[220px]" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-light">Security Checks</CardTitle></CardHeader>
            <CardContent className="flex justify-center items-center"><div ref={securityChartRef} className="h-[220px]" /></CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-light">By Stage</CardTitle></CardHeader>
            <CardContent className="flex justify-center items-center"><div ref={stageChartRef} className="h-[200px]" /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-light">By Club</CardTitle></CardHeader>
            <CardContent><div ref={clubChartRef} className="w-full h-[200px]" /></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
