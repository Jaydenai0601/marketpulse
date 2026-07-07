#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据 history.json 和现有 daily_data.json 生成历史归档文件。
仅用于初始化演示数据；后续运行 backend/run.py 会自动维护 archive/ 目录。
"""
import json
import os
import random
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
ARCHIVE_DIR = os.path.join(DATA_DIR, "archive")

with open(os.path.join(DATA_DIR, "daily_data.json"), "r", encoding="utf-8") as f:
    latest = json.load(f)

with open(os.path.join(DATA_DIR, "history.json"), "r", encoding="utf-8") as f:
    history = json.load(f)

os.makedirs(ARCHIVE_DIR, exist_ok=True)

# 为 history 中的每一天生成归档（最新的一天用真实 daily_data，其余用派生演示数据）
for idx, h in enumerate(history):
    date = h["date"]
    out_path = os.path.join(ARCHIVE_DIR, f"{date}.json")
    if date == latest.get("date"):
        archive = latest
    else:
        # 用历史总分派生一份演示归档
        score = h["score"]
        archive = {
            "date": date,
            "overall_score": score,
            "sentiment_label": h["sentiment"],
            "news_count": latest.get("news_count", 42),
            "bull_count": max(0, int(latest.get("bull_count", 28) + (score - 60) / 5 + random.randint(-2, 2))),
            "bear_count": max(0, int(latest.get("bear_count", 10) - (score - 60) / 8 + random.randint(-2, 2))),
            "neutral_count": max(0, latest.get("neutral_count", 4) + random.randint(-1, 1)),
            "sectors": [
                {**s, "score": max(-5, min(5, round(s["score"] + (score - 60) / 15 + random.uniform(-1, 1), 1)))}
                for s in latest.get("sectors", [])
            ],
            "top_events": latest.get("top_events", []),
            "report_text": f"📰 市场情绪日报 — {date}\n\n━━ 整体情绪 ━━━━━━━━━\n今日市场情绪：{h['sentiment']}（{score}/100）\n核心驱动：详见当日新闻分析\n\n（本日为演示归档数据，实际运行 backend/run.py 后会用真实抓取数据覆盖）",
            "raw_news": []
        }
        # 归一化让情绪标签与分数一致
        for s in archive["sectors"]:
            if s["score"] > 1:
                s["label"] = "偏多" if s["score"] <= 3 else "强偏多"
            elif s["score"] < -1:
                s["label"] = "偏空"
            else:
                s["label"] = "中性"
        # 让数量总和不超过 news_count
        total = archive["bull_count"] + archive["bear_count"] + archive["neutral_count"]
        if total > archive["news_count"]:
            archive["neutral_count"] = max(0, archive["neutral_count"] - (total - archive["news_count"]))

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(archive, f, ensure_ascii=False, indent=2)
    print(f"✅ 已生成 {out_path}")
