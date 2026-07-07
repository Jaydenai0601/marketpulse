'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/nav';
import { Chart } from '@/components/chart';
import { SentimentTag } from '@/components/sentiment-tag';

interface HistoryItem {
  date: string;
  sentiment: string;
  score: number;
  change: string;
  sectors: number;
}

interface Trends {
  dates: string[];
  overall: number[];
  sectors: Record<string, (number | null)[]>;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/history').then((r) => r.json()), fetch('/api/trends').then((r) => r.json())])
      .then(([h, t]) => {
        setHistory(h);
        setTrends(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const trendOption = trends
    ? {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#14161c', borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#e2e4e9' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: trends.dates, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: '#6b7080' } },
        yAxis: { type: 'value', min: 40, max: 80, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }, axisLabel: { color: '#6b7080' } },
        series: [{
          data: trends.overall,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#5b8cff', width: 2.5 },
          itemStyle: { color: '#5b8cff' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(91,140,255,0.15)' }, { offset: 1, color: 'rgba(91,140,255,0.01)' }] } },
        }],
      }
    : {};

  const colors = ['#2ebd85', '#5b8cff', '#eb5757', '#f2c94c', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635'];
  const sectorNames = trends ? Object.keys(trends.sectors) : [];
  const sectorTrendOption = trends
    ? {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#14161c', borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#e2e4e9' } },
        legend: { data: sectorNames, textStyle: { color: '#6b7080', fontSize: 11 }, top: 0, type: 'scroll' },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
        xAxis: { type: 'category', data: trends.dates, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: '#6b7080' } },
        yAxis: { type: 'value', min: -5, max: 5, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }, axisLabel: { color: '#6b7080' } },
        series: sectorNames.map((name, i) => ({
          name,
          type: 'line',
          smooth: true,
          data: trends.sectors[name],
          lineStyle: { color: colors[i % colors.length], width: 2 },
          itemStyle: { color: colors[i % colors.length] },
          symbol: 'circle',
          symbolSize: 5,
          connectNulls: true,
        })),
      }
    : {};

  if (loading) {
    return (
      <>
        <Nav />
        <div className="loading-wrap">
          <div className="spinner" />
          <div style={{ color: '#6b7080', fontSize: 14 }}>正在加载历史数据...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="container">
        <div style={{ padding: '32px 0 8px' }} className="fade-up">
          <div className="page-title">历史回顾</div>
          <div className="page-subtitle">近7日市场情绪变化与板块轮动</div>
        </div>

        <div className="grid-2" style={{ marginTop: 24 }}>
          <div className="card fade-up">
            <div className="section-title">市场整体情绪趋势</div>
            <Chart option={trendOption} height={280} />
          </div>
          <div className="card fade-up delay-1">
            <div className="section-title">板块情绪轮动</div>
            <Chart option={sectorTrendOption} height={280} />
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">历史日报归档</div>
          <div>
            {history.map((d, i) => (
              <div key={i} className="list-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', color: '#6b7080', minWidth: 100 }}>{d.date}</span>
                  <SentimentTag label={d.sentiment} />
                  <span style={{ fontSize: '14px', fontWeight: 600, minWidth: 30 }}>{d.score}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7080' }}>
                  较昨日 {d.change} · {d.sectors} 个板块
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
