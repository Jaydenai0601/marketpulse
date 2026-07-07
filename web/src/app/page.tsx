import Link from 'next/link';
import { getLatestReport, getHistory } from '@/lib/data';
import { formatDate, scoreClass, scoreColor } from '@/lib/utils';
import { Nav } from '@/components/nav';
import { SentimentTag } from '@/components/sentiment-tag';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [report, history] = await Promise.all([getLatestReport(), getHistory()]);
  if (!report) {
    return (
      <>
        <Nav />
        <div className="container">
          <div className="card" style={{ marginTop: 40 }}>
            <div className="error-box">暂无数据，请先运行后端爬虫或执行 seed。</div>
          </div>
        </div>
      </>
    );
  }

  const positiveCount = report.sectors.filter((s) => s.score > 0).length;
  const negativeCount = report.sectors.filter((s) => s.score < 0).length;
  const topEvents = report.topEvents.slice(0, 3);

  return (
    <>
      <Nav />
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 0 32px' }} className="fade-up">
          <h1 style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.5px' }}>AI 驱动的市场情绪雷达</h1>
          <p style={{ color: '#6b7080', marginTop: 12, fontSize: '15px', maxWidth: 480, lineHeight: 1.6, margin: '12px auto 0' }}>
            每日自动抓取财经新闻，AI 分析情绪、生成可视化日报
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/daily" className="btn-primary">查看今日日报</Link>
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 32 }}>
          <div className="card fade-up" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 10 }}>最新市场情绪</div>
            <div className={`score-big ${scoreClass(report.overallScore)}`}>{report.overallScore}</div>
            <div style={{ marginTop: 8 }}><SentimentTag label={report.sentimentLabel} /></div>
            <div style={{ marginTop: 10, fontSize: '13px', color: '#6b7080' }}>日期 {report.date}</div>
            <div className="meter" style={{ marginTop: 16 }}>
              <div className="meter-fill" style={{ width: `${report.overallScore}%`, background: scoreColor(report.overallScore - 50) }} />
            </div>
          </div>

          <div className="card fade-up delay-1" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 10 }}>分析新闻</div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>{report.newsCount}</div>
            <div style={{ fontSize: '13px', color: '#6b7080', marginTop: 8 }}>条</div>
          </div>

          <div className="card fade-up delay-2" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 10 }}>覆盖板块</div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>{report.sectors.length}</div>
            <div style={{ fontSize: '13px', color: '#6b7080', marginTop: 8 }}>
              偏多 {positiveCount} · 偏空 {negativeCount}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <div className="section-title">核心功能</div>
          <div className="grid-3">
            {[
              { title: '自动采集', desc: '每日抓取东方财富、财联社、新浪财经等主流财经源' },
              { title: 'AI 情绪分析', desc: '大模型逐条分析情绪、强度、影响板块与关键数据' },
              { title: '可视化日报', desc: '自动生成结构化日报，含板块热力与驱动事件' },
            ].map((f, i) => (
              <div key={i} className={`card fade-up delay-${i + 1}`}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: '14px', color: '#6b7080', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div className="section-title" style={{ margin: 0 }}>最新日报 · {report.date}</div>
            <Link href="/daily" className="btn">查看完整日报 →</Link>
          </div>
          <div className="card fade-up">
            <div style={{ fontSize: '13px', color: '#6b7080', marginBottom: 16 }}>
              {report.newsCount} 条新闻 · {report.sectors.length} 个板块
            </div>
            <div className="grid-3">
              {topEvents.map((e, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ marginBottom: 10 }}>
                    <span className={e.sentiment === '利好' ? 'tag-bull' : 'tag-bear'}>{e.sentiment}·{e.intensity}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}>{e.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7080' }}>{e.sectors}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
