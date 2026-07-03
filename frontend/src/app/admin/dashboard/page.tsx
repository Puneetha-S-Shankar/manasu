"use client";

import React, { useEffect, useState, useMemo } from "react";

// EMOTION_COLORS mapping
const EMOTION_COLORS: Record<string, string> = {
  Bad: "#818CF8",
  Afraid: "#34D399",
  Angry: "#F87171",
  Disgust: "#A78BFA",
  Sad: "#60A5FA",
  Happy: "#FBBF24",
  Surprise: "#F472B6",
};

interface DayMoodPoint {
  date: string;
  count: number;
}

interface Metrics {
  total_users: number;
  total_checkins: number;
  checkins_last_7d: number;
  checkins_last_30d: number;
  emotion_distribution: Record<string, number>;
  avg_intensity_overall: number;
  low_mood_streak_count: number;
  daily_checkins_last_30d: DayMoodPoint[];
}

function StatCard({ title, value, valueColor = "white" }: { title: string; value: string | number; valueColor?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex flex-col justify-center">
      <div className="text-[12px] font-medium text-white/40 mb-2">{title}</div>
      <div className="text-[32px] font-serif" style={{ color: valueColor, fontFamily: "Georgia, serif" }}>
        {value}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: DayMoodPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-[13px] text-white/30">
        Not enough data yet
      </div>
    );
  }

  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const minCount = 0;

  const getX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * innerWidth;
  const getY = (count: number) => padding.top + innerHeight - ((count - minCount) / (maxCount - minCount)) * innerHeight;

  const points = data.map((d, i) => `${getX(i)},${getY(d.count)}`).join(" ");

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${width}/${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Line */}
        <polyline
          fill="none"
          stroke="#C084FC"
          strokeWidth="2"
          points={points}
        />
        
        {/* Points and Hover Areas */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.count);
          const isHovered = hoverIndex === i;
          return (
            <g key={i}>
              {isHovered && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r="3"
                fill="#C084FC"
                className="transition-transform"
                style={{ transform: isHovered ? "scale(1.5)" : "scale(1)", transformOrigin: `${x}px ${y}px` }}
              />
              <rect
                x={x - (innerWidth / data.length) / 2}
                y={padding.top}
                width={innerWidth / data.length}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair"
              />
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          if (i % 5 === 0) {
            const x = getX(i);
            const dateStr = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                fill="rgba(255,255,255,0.25)"
                fontSize="10px"
                textAnchor="middle"
              >
                {dateStr}
              </text>
            );
          }
          return null;
        })}
      </svg>
      
      {/* Tooltip */}
      {hoverIndex !== null && (
        <div 
          className="absolute pointer-events-none bg-[#1f1c19] border border-white/[0.08] shadow-xl rounded-lg p-3 z-10"
          style={{
            left: Math.min(Math.max(getX(hoverIndex), 60), width - 60) + "%",
            transform: `translate(calc(${getX(hoverIndex) / width * 100}% - 50%), -110%)`,
            top: (getY(data[hoverIndex].count) / height * 100) + "%",
          }}
        >
          <div className="text-[11px] text-white/40 mb-1">{data[hoverIndex].date}</div>
          <div className="text-[13px] font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C084FC]" />
            {data[hoverIndex].count} check-ins
          </div>
        </div>
      )}
    </div>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-[13px] text-white/30">
        No emotion data yet
      </div>
    );
  }

  const maxCount = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div className="flex flex-col gap-3 py-2">
      {entries.map(([emotion, count]) => {
        const percentage = (count / maxCount) * 100;
        const color = EMOTION_COLORS[emotion] || "#888888";
        return (
          <div key={emotion} className="flex items-center gap-3">
            <div className="w-[60px] text-right text-[11px] text-white/50 truncate">
              {emotion}
            </div>
            <div className="flex-1 h-[8px] bg-white/[0.04] rounded-full overflow-hidden flex items-center">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${percentage}%`, backgroundColor: color }} 
              />
            </div>
            <div className="w-[30px] text-[11px] text-white/40">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setMetrics(data))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-semibold text-white/90 mb-8">Admin Dashboard</h1>

      {error ? (
        <div className="h-[400px] flex items-center justify-center text-white/50 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          Failed to load metrics
        </div>
      ) : !metrics ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {[1,2,3,4].map(i => <div key={i} className="h-[104px] bg-white/[0.04] rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
             <div className="h-[320px] bg-white/[0.04] rounded-xl" />
             <div className="h-[320px] bg-white/[0.04] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard title="Total Users" value={metrics.total_users} />
            <StatCard title="Total Check-ins" value={metrics.total_checkins} />
            <StatCard title="Last 7 Days" value={metrics.checkins_last_7d} />
            <StatCard 
              title="Low Mood Streaks" 
              value={metrics.low_mood_streak_count} 
              valueColor={metrics.low_mood_streak_count > 0 ? "#F97060" : "white"} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
              <h2 className="text-[14px] font-medium text-white/70 mb-6">Check-in Trend</h2>
              <LineChart data={metrics.daily_checkins_last_30d} />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
              <h2 className="text-[14px] font-medium text-white/70 mb-6">Emotion Distribution</h2>
              <BarChart data={metrics.emotion_distribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
