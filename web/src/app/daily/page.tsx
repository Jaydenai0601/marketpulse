'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/nav';
import { SentimentTag } from '@/components/sentiment-tag';
import { SectorList } from '@/components/sector-list';
import { Chart } from '@/components/chart';
import { formatDate, scoreClass, scoreColor } from '@/lib/utils';
import type { DailyReportWithRelations } from '@/lib/data';

interface HistoryItem {
  date: string;
  sentiment: string;
  score: number;
  change: string;
  sectors: number;
}

export default function DailyPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [report, setReport] = useState<DailyReportWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data: HistoryItem[]) => {
        setHistory(data);
        if (data.length > 0) setSelectedDate(data[0].date);
      })
      .catch(() => setError('无法加载历史日期'));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    fetch(`/api/daily?date=${selectedDate}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('加载失败');
        return r.json();
      })
      .then((data: DailyReportWithRelations) => {
        setReport(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [selectedDate]);

  const sectorChartOption = report
    ? {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#14161c', borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#e2e4e9' } },
        grid: { left: '3%', right: '4%', bottom: '18%', top: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: report.sectors.map((s) => s.name),
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          axisLabel: { color: '#6b7080', interval: 0, rotate: 45, fontSize: 11 },
          axisTick: { alignWithLabel: true },
        },
        yAxis: { type: 'value', min: -5, max: 5, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }, axisLabel: { color: '#6b7080' } },
        dataZoom: [
          { type: 'inside', start: 0, end: Math.min(100, (20 / report.sectors.length) * 100) },
          { type: 'slider', start: 0, end: Math.min(100, (20 / report.sectors.length) * 100), height: 16, bottom: 8, borderColor: 'rgba(255,255,255,0.06)', fillerColor: 'rgba(91,140,255,0.2)', handleStyle: { color: '#5b8cff' }, textStyle: { color: '#6b7080' } },
        ],
        series: [{
          data: report.sectors.map((s) => ({
            value: s.score,
            itemStyle: { color: scoreColor(s.score), borderRadius: s.score >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] },
          })),
          type: 'bar',
          barWidth: '45%',
        }],
      }
    : {};

  if (loading && !report) {
    return (
      <>
        <Nav />
        <div className="loading-wrap">
          <div className="spinner" />
          <div style={{ color: '#6b7080', fontSize: 14 }}>正在加载市场数据...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Nav />
        <div className="container">
          <div className="card" style={{ marginTop: 40 }}>
            <div className="error-box">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!report) return null;

  const idx = history.findIndex((h) => h.date === report.date);
  const prev = history[idx + 1];
  const change = prev ? report.overallScore - prev.score : 0;
  const changePct = prev ? Math.round((change / prev.score) * 100) : 0;

  const coreDriver = report.reportText
    ? report.reportText.split('核心驱动：')[1]?.split('\n')[0] || '暂无核心驱动摘要'
    : '暂无核心驱动摘要';

  return (
    <>
      <Nav />
      <div className="container">
        <div style={{ padding: '32px 0 8px' }} className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="page-title">市场情绪日报</div>
              <div className="page-subtitle">{formatDate(report.date)}</div>
            </div>
            <div className="date-picker">
              <span style={{ color: '#6b7080', fontSize: 14 }}>切换日期</span>
              <select className="date-select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                {history.map((h) => (
                  <option key={h.date} value={h.date}>
                    {h.date} · {h.sentiment}（{h.score}）
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 24 }}>
          <div className="card fade-up">
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 12 }}>整体情绪</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className={`score-big ${scoreClass(report.overallScore)}`}>{report.overallScore}</span>
              <SentimentTag label={report.sentimentLabel} />
            </div>
            <div style={{ marginTop: 10, fontSize: '14px', color: '#6b7080' }}>
              较昨日 {change >= 0 ? '+' : ''}
              {change}
              <span style={{ color: change >= 0 ? '#2ebd85' : '#eb5757', marginLeft: 6 }}>
                {change >= 0 ? '↗' : '↘'} {change >= 0 ? '+' : ''}
                {changePct}%
              </span>
              {prev && <span style={{ marginLeft: 8 }}>（昨日 {prev.score}）</span>}
            </div>
            <div style={{ marginTop: 10, fontSize: '13px', color: '#8b8f99' }}>{coreDriver}</div>
            <div className="meter" style={{ marginTop: 16 }}>
              <div className="meter-fill" style={{ width: `${report.overallScore}%`, background: scoreColor(report.overallScore - 50) }} />
            </div>
          </div>

          <div className="card fade-up delay-1">
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 12 }}>数据概览</div>
            <div className="grid-2" style={{ gap: 12 }}>
              {[
                { label: '分析新闻', value: report.newsCount },
                { label: '利好', value: report.bullCount },
                { label: '利空', value: report.bearCount },
                { label: '中性', value: report.neutralCount },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  <div style={{ fontSize: '12px', color: '#6b7080' }}>{item.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 600, marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card fade-up delay-2" style={{ marginTop: 20 }}>
          <div className="section-title">板块情绪热力</div>
          <Chart option={sectorChartOption} height={300} />
        </div>

        <div className="card fade-up delay-2" style={{ marginTop: 20 }}>
          <div className="section-title">板块详情（点击展开）</div>
          <SectorList sectors={report.sectors} />
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="section-title">今日 Top 3 驱动事件</div>
          <div className="grid-3">
            {report.topEvents.slice(0, 3).map((e, i) => (
              <div key={i} className={`card fade-up delay-${i + 1}`} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#5b8cff', minWidth: 20 }}>{i + 1}</span>
                  <span className={e.sentiment === '利好' ? 'tag-bull' : 'tag-bear'}>{e.sentiment}·{e.intensity}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>{e.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7080', marginBottom: 10 }}>{e.sectors}</div>
                <div style={{ fontSize: '13px', color: '#8b8f99', lineHeight: 1.6, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>{e.impact}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-up" style={{ marginTop: 20 }}>
          <div className="section-title">日报原文</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#8b8f99', lineHeight: 1.8, fontFamily: 'inherit' }}>
            {report.reportText || '暂无日报文本'}
          </pre>
        </div>
      </div>
    </>
  );
}
