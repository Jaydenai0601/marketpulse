#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主运行脚本：抓取新闻 → AI 分析 → 生成数据 → 输出 JSON

使用方法：
    1. 设置环境变量：export DEEPSEEK_API_KEY="your-api-key"
    2. 运行：python run.py
    3. 结果保存在 ../data/daily_data.json
"""

import os
import sys
import json
from datetime import datetime, timedelta

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crawler import get_all_news
from analyzer import AIAnalyzer, aggregate_data


def load_historical_data(data_dir: str) -> list:
    """加载历史数据"""
    history_file = os.path.join(data_dir, "history.json")
    if os.path.exists(history_file):
        with open(history_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_data(data_dir: str, daily_data: dict, history: list):
    """保存数据：当日快照 + 按日期归档 + 历史索引"""
    os.makedirs(data_dir, exist_ok=True)

    # 保存当日数据（前端默认读取）
    daily_file = os.path.join(data_dir, "daily_data.json")
    with open(daily_file, "w", encoding="utf-8") as f:
        json.dump(daily_data, f, ensure_ascii=False, indent=2)

    # 按日期归档，便于前端切换历史日期
    archive_dir = os.path.join(data_dir, "archive")
    os.makedirs(archive_dir, exist_ok=True)
    archive_file = os.path.join(archive_dir, f"{daily_data['date']}.json")
    with open(archive_file, "w", encoding="utf-8") as f:
        json.dump(daily_data, f, ensure_ascii=False, indent=2)

    # 更新历史数据
    history_file = os.path.join(data_dir, "history.json")
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"\n💾 数据已保存:")
    print(f"   - {daily_file}")
    print(f"   - {archive_file}")
    print(f"   - {history_file}")


def main():
    print("=" * 50)
    print(" MarketPulse — 财经新闻情绪分析")
    print("=" * 50)

    today = datetime.now().strftime("%Y-%m-%d")
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

    # 检查 API Key
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("\n⚠️  未设置 DEEPSEEK_API_KEY 环境变量")
        print("   请执行: export DEEPSEEK_API_KEY='your-api-key'")
        print("   或修改本脚本直接传入 api_key")
        print("\n   获取 API Key: https://platform.deepseek.com")
        return

    # Step 1: 抓取新闻
    news_list = get_all_news(fetch_content=False)
    if not news_list:
        print("\n❌ 未抓取到任何新闻，请检查网络连接")
        return

    # Step 2: AI 分析
    print(f"\n🤖 开始 AI 情绪分析（共 {len(news_list)} 条）...")
    analyzer = AIAnalyzer(api_key=api_key)
    analyzed = analyzer.analyze_batch(news_list)

    # Step 3: 聚合数据
    print("\n📊 聚合分析数据...")
    aggregated = aggregate_data(analyzed)

    # Step 4: 生成日报文本
    print("\n📝 生成日报...")
    report_text = analyzer.generate_daily_report(analyzed, today)

    # Step 5: 构建前端数据
    daily_data = {
        "date": today,
        "overall_score": aggregated["overall_score"],
        "sentiment_label": aggregated["sentiment_label"],
        "news_count": aggregated["news_count"],
        "bull_count": aggregated["bull_count"],
        "bear_count": aggregated["bear_count"],
        "neutral_count": aggregated["neutral_count"],
        "sectors": aggregated["sectors"],
        "top_events": aggregated["top_events"],
        "report_text": report_text,
        "raw_news": [
            {"title": n["title"], "source": n["source"], "analysis": n["analysis"]}
            for n in analyzed
        ]
    }

    # Step 6: 更新历史
    history = load_historical_data(data_dir)
    # 去重：如果今天已有数据，替换
    history = [h for h in history if h.get("date") != today]
    history.insert(0, {
        "date": today,
        "sentiment": aggregated["sentiment_label"],
        "score": aggregated["overall_score"],
        "change": "+0%",  # 实际应由前端计算
        "sectors": len(aggregated["sectors"])
    })
    history = history[:30]  # 只保留最近30天

    # Step 7: 保存
    save_data(data_dir, daily_data, history)

    print("\n✅ 完成！")
    print(f"\n   今日情绪: {aggregated['sentiment_label']} ({aggregated['overall_score']}/100)")
    print(f"   利好: {aggregated['bull_count']} 条")
    print(f"   利空: {aggregated['bear_count']} 条")
    print(f"   中性: {aggregated['neutral_count']} 条")
    print(f"   涉及板块: {len(aggregated['sectors'])} 个")

    # 打印日报
    print("\n" + "=" * 50)
    print(report_text)
    print("=" * 50)


if __name__ == "__main__":
    main()
