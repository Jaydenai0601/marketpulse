#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 情绪分析模块
调用大模型 API，对新闻进行逐条情绪分析并生成日报
"""

import os
import json
import time
from typing import List, Dict, Any

# 默认使用 DeepSeek，便宜且国内访问好
# 也可以换成其他：openai, zhipu, dashscope 等
DEFAULT_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
DEFAULT_MODEL = "deepseek-chat"


PROMPT_ANALYZE_SINGLE = """你是资深财经分析师，擅长从新闻报道中提取关键信息并判断其对金融市场的影响。

请对以下新闻进行结构化分析，输出 JSON 格式：

【新闻内容】
{content}

【分析要求】
1. 情绪标签：判断该新闻对整体市场/特定板块的情绪倾向（利好 / 利空 / 中性）
2. 情绪强度：用 1-5 分评分（1=轻微影响，5=重大市场冲击）
3. 影响范围：判断影响层级（宏观全局 / 行业板块 / 个股级别）
4. 关联板块：列出该新闻最直接影响的 1-3 个行业板块（如新能源、银行、半导体、房地产、医药等）
5. 关键信息：提取新闻中的核心数据点或政策信号（如"降准50bp"、"GDP增速5.2%"、"销量同比+15%"）
6. 理由简述：用一句话说明为什么这样判断（控制在30字以内）

【输出格式】
请严格输出以下 JSON 格式，不要添加其他解释文字：

{{
  "sentiment": "利好/利空/中性",
  "intensity": 3,
  "scope": "宏观全局/行业板块/个股级别",
  "sectors": ["板块1", "板块2"],
  "key_data": "核心数据点",
  "reason": "判断理由"
}}

【判断标准参考】
- 利好：政策刺激、业绩超预期、行业扶持政策、流动性宽松、需求回暖
- 利空：政策收紧、业绩不及预期、行业监管加强、流动性收紧、需求下滑
- 中性：行业常规报道、数据发布未超预期、人事变动等
- 强度判断：影响重大市场指数（5）、影响板块趋势（3-4）、影响个股或行业预期（1-2）
"""


PROMPT_GENERATE_DAILY = """你是资深市场策略分析师，擅长将繁杂的市场信息整合为清晰、可读的投资日报。

请根据以下今日新闻的情绪分析结果，生成一份结构化的"市场情绪日报"。

【今日新闻分析汇总】
{analysis_json}

【日报生成要求】

1. 整体情绪
   - 计算今日整体市场情绪指数（按情绪加权，0-100分，50为中性）
   - 判断今日情绪倾向：偏多/偏空/中性
   - 与昨日（如有数据）对比，情绪是升温还是降温

2. 板块情绪热力图
   - 按板块分类汇总，列出每个板块今日的情绪得分（-5到+5，0为中性）
   - 标注每个板块的关键驱动事件（1-2条）
   - 用 🟢偏多 / 🟡中性 / 🔴偏空 标记板块

3. 今日 Top 3 驱动事件
   - 选出今日对市场影响最大的 3 条新闻
   - 每条包含：事件简述、情绪标签、影响板块、对市场的具体意义

4. 风险提示（如有）
   - 如果存在需特别关注的风险信号，单独列出

5. 投资建议摘要（可选，简短）
   - 基于今日情绪，给出 1-2 句话的盘面观察或策略提示

【输出格式】
请用以下格式输出日报，保持简洁、专业、可读性强：

━━━━━━━━━━━━━━━━━━━━━━
📰 市场情绪日报 — {date}

━━ 整体情绪 ━━━━━━━━━
今日市场情绪：偏多（68/100）
较昨日：升温 +12%（昨日 56→今日 68）
核心驱动：政策利好密集释放，新能源、半导体板块受提振

━━ 板块情绪热力 ━━━━━━━━━
🟢 新能源    +4  ｜ 补贴新规预期升温，产业链全线走强
🟢 半导体    +3  ｜ 国产替代重大突破
🟡 医药      +1  ｜ 集采影响消化
🟡 消费      0   ｜ 端午消费数据平淡
🔴 房地产    -3  ｜ 销售数据不及预期
🔴 银行      -2  ｜ 息差收窄预期

━━ 今日 Top 3 驱动事件 ━━━━━━━━━

1️⃣ 【利好·强】国务院发布新能源补贴延续政策
   → 影响板块：新能源
   → 市场意义：打消补贴退坡担忧，产业链中期盈利预期修复

2️⃣ 【利空·中】6月商品房销售面积同比-8%
   → 影响板块：房地产
   → 市场意义：地产链复苏低于预期

3️⃣ 【利好·中】半导体设备国产化项目获重大突破
   → 影响板块：半导体
   → 市场意义：技术突破降低对外依赖

━━ 风险提示 ━━━━━━━━━
⚠️ 关注下周美联储议息会议

━━ 盘面观察 ━━━━━━━━━
📌 今日情绪面偏暖，科技成长赛道明显占优。
━━━━━━━━━━━━━━━━━━━━━━

请根据实际数据生成日报，不要编造不存在的信息。今天是 {date}。
"""


class AIAnalyzer:
    """AI 情绪分析器"""

    def __init__(self, api_key: str = None, base_url: str = None, model: str = None):
        self.api_key = api_key or DEFAULT_API_KEY
        self.base_url = base_url or DEFAULT_BASE_URL
        self.model = model or DEFAULT_MODEL

        if not self.api_key:
            raise ValueError("请设置 API Key：DEEPSEEK_API_KEY 环境变量或直接传入")

        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        except ImportError:
            raise ImportError("请先安装 openai: pip install openai")

    def _call_llm(self, prompt: str, temperature: float = 0.3) -> str:
        """调用大模型"""
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的财经分析师。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=1500,
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"[LLM 调用失败] {e}")
            return ""

    def analyze_single(self, content: str) -> Dict[str, Any]:
        """单条新闻情绪分析"""
        prompt = PROMPT_ANALYZE_SINGLE.format(content=content)
        raw = self._call_llm(prompt, temperature=0.1)

        # 尝试解析 JSON
        try:
            # 提取 JSON 部分
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = raw[start:end]
                return json.loads(json_str)
        except Exception:
            pass

        # 解析失败，返回默认值
        return {
            "sentiment": "中性",
            "intensity": 1,
            "scope": "行业板块",
            "sectors": ["未知"],
            "key_data": "",
            "reason": "解析失败"
        }

    def analyze_batch(self, news_list: List[Dict]) -> List[Dict]:
        """批量分析新闻"""
        results = []
        total = len(news_list)
        for i, news in enumerate(news_list):
            print(f"  🤖 分析 {i+1}/{total}: {news['title'][:40]}...")
            analysis = self.analyze_single(news["content"])
            results.append({
                **news,
                "analysis": analysis
            })
            time.sleep(0.5)  # 控制速率，避免触发限流
        return results

    def generate_daily_report(self, analyzed_news: List[Dict], date_str: str) -> str:
        """生成日报"""
        # 构建分析汇总
        summary_items = []
        for n in analyzed_news:
            a = n.get("analysis", {})
            summary_items.append({
                "title": n.get("title", ""),
                "source": n.get("source", ""),
                "sentiment": a.get("sentiment", "中性"),
                "intensity": a.get("intensity", 1),
                "sectors": a.get("sectors", []),
                "key_data": a.get("key_data", ""),
                "reason": a.get("reason", "")
            })

        analysis_json = json.dumps(summary_items, ensure_ascii=False, indent=2)
        prompt = PROMPT_GENERATE_DAILY.format(analysis_json=analysis_json, date=date_str)
        return self._call_llm(prompt, temperature=0.5)


def aggregate_data(analyzed_news: List[Dict]) -> Dict[str, Any]:
    """聚合分析数据，生成前端可用的结构化数据"""
    from collections import defaultdict

    # 统计
    bull_count = sum(1 for n in analyzed_news if n.get("analysis", {}).get("sentiment") == "利好")
    bear_count = sum(1 for n in analyzed_news if n.get("analysis", {}).get("sentiment") == "利空")
    neutral_count = len(analyzed_news) - bull_count - bear_count

    # 计算整体情绪指数（0-100）
    if analyzed_news:
        scores = []
        for n in analyzed_news:
            s = n.get("analysis", {}).get("sentiment", "中性")
            intensity = n.get("analysis", {}).get("intensity", 1)
            if s == "利好":
                scores.append(50 + intensity * 10)
            elif s == "利空":
                scores.append(50 - intensity * 10)
            else:
                scores.append(50)
        overall_score = max(0, min(100, int(sum(scores) / len(scores))))
    else:
        overall_score = 50

    # 板块聚合
    sector_scores = defaultdict(list)
    sector_events = defaultdict(list)
    for n in analyzed_news:
        a = n.get("analysis", {})
        sectors = a.get("sectors", [])
        sentiment = a.get("sentiment", "中性")
        intensity = a.get("intensity", 1)
        for sec in sectors:
            score = intensity if sentiment == "利好" else (-intensity if sentiment == "利空" else 0)
            sector_scores[sec].append(score)
            sector_events[sec].append(n.get("title", ""))

    sector_summary = []
    for sec, scores in sector_scores.items():
        avg = round(sum(scores) / len(scores), 1)
        events = sector_events[sec][:2]
        sector_summary.append({
            "name": sec,
            "score": avg,
            "label": "偏多" if avg > 1 else "偏空" if avg < -1 else "中性",
            "events": events
        })
    sector_summary.sort(key=lambda x: abs(x["score"]), reverse=True)

    # Top 3 事件（按强度排序）
    sorted_news = sorted(
        analyzed_news,
        key=lambda x: x.get("analysis", {}).get("intensity", 0),
        reverse=True
    )[:3]

    top_events = []
    for n in sorted_news:
        a = n.get("analysis", {})
        top_events.append({
            "title": n.get("title", ""),
            "sentiment": a.get("sentiment", "中性"),
            "intensity": "强" if a.get("intensity", 0) >= 4 else "中" if a.get("intensity", 0) >= 2 else "弱",
            "sectors": "、".join(a.get("sectors", [])),
            "impact": a.get("reason", "")
        })

    return {
        "overall_score": overall_score,
        "sentiment_label": "偏多" if overall_score > 55 else "偏空" if overall_score < 45 else "中性",
        "news_count": len(analyzed_news),
        "bull_count": bull_count,
        "bear_count": bear_count,
        "neutral_count": neutral_count,
        "sectors": sector_summary,
        "top_events": top_events,
    }


if __name__ == "__main__":
    # 测试
    analyzer = AIAnalyzer()
    test = analyzer.analyze_single("央行宣布降准0.5个百分点，释放长期资金约1万亿元")
    print(json.dumps(test, ensure_ascii=False, indent=2))
