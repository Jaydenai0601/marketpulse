import { NextResponse } from 'next/server';
import { upsertDailyReport } from '@/lib/data';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 模式1：请求体直接带 payload，直接入库
  try {
    const body = await request.json().catch(() => ({}));
    if (body.payload) {
      const report = await upsertDailyReport(body.payload);
      return NextResponse.json({ ok: true, source: 'payload', date: report.date });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  // 模式2：本地/服务器环境执行 Python 爬虫
  return await new Promise<Response>((resolve) => {
    const script = path.resolve(process.cwd(), '..', 'backend', 'run.py');
    const proc = spawn('python3', [script], {
      env: { ...process.env, PATH: process.env.PATH },
      cwd: path.resolve(process.cwd(), '..'),
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', async (code) => {
      if (code !== 0) {
        resolve(NextResponse.json({ error: 'Crawler failed', stderr, stdout }, { status: 500 }));
        return;
      }
      try {
        const dataFile = path.resolve(process.cwd(), '..', 'data', 'daily_data.json');
        const raw = fs.readFileSync(dataFile, 'utf-8');
        const payload = JSON.parse(raw);
        const report = await upsertDailyReport(payload);
        resolve(NextResponse.json({ ok: true, source: 'python', date: report.date }));
      } catch (e: any) {
        resolve(NextResponse.json({ error: e.message, stderr, stdout }, { status: 500 }));
      }
    });
  });
}
