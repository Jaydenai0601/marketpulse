import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function loadDailyData(): any {
  const dataPath = path.resolve(process.cwd(), '..', 'data', 'daily_data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

async function main() {
  const payload = loadDailyData();
  await prisma.dailyReport.upsert({
    where: { date: payload.date },
    update: {
      overallScore: payload.overall_score,
      sentimentLabel: payload.sentiment_label,
      newsCount: payload.news_count,
      bullCount: payload.bull_count,
      bearCount: payload.bear_count,
      neutralCount: payload.neutral_count,
      reportText: payload.report_text,
      sectors: {
        deleteMany: {},
        create: payload.sectors.map((s: any) => ({
          name: s.name,
          score: s.score,
          label: s.label,
          events: JSON.stringify(s.events || []),
        })),
      },
      topEvents: {
        deleteMany: {},
        create: payload.top_events.map((e: any) => ({
          title: e.title,
          sentiment: e.sentiment,
          intensity: e.intensity,
          sectors: e.sectors,
          impact: e.impact,
        })),
      },
    },
    create: {
      date: payload.date,
      overallScore: payload.overall_score,
      sentimentLabel: payload.sentiment_label,
      newsCount: payload.news_count,
      bullCount: payload.bull_count,
      bearCount: payload.bear_count,
      neutralCount: payload.neutral_count,
      reportText: payload.report_text,
      sectors: {
        create: payload.sectors.map((s: any) => ({
          name: s.name,
          score: s.score,
          label: s.label,
          events: JSON.stringify(s.events || []),
        })),
      },
      topEvents: {
        create: payload.top_events.map((e: any) => ({
          title: e.title,
          sentiment: e.sentiment,
          intensity: e.intensity,
          sectors: e.sectors,
          impact: e.impact,
        })),
      },
    },
  });
  console.log(`✅ Seeded report for ${payload.date}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
