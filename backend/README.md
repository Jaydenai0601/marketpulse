# MarketPulse — 财经新闻情绪分析后端

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 获取 API Key

本脚本使用 DeepSeek 大模型进行情绪分析（便宜、国内访问快）：

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com)
2. 注册账号并创建 API Key
3. 复制 Key

### 3. 设置环境变量并运行

```bash
# Linux / Mac
export DEEPSEEK_API_KEY="your-api-key-here"
python run.py

# Windows PowerShell
$env:DEEPSEEK_API_KEY="your-api-key-here"
python run.py
```

### 4. 查看结果

运行完成后，数据保存在：
- `../data/daily_data.json` — 当日分析结果（前端直接读取）
- `../data/history.json` — 历史数据归档

## 文件说明

| 文件 | 说明 |
|------|------|
| `crawler.py` | 新闻爬虫（东方财富、新浪财经） |
| `analyzer.py` | AI 情绪分析 + 数据聚合 |
| `run.py` | 主运行脚本 |
| `requirements.txt` | Python 依赖 |

## 成本估算

使用 DeepSeek 模型分析 25 条新闻，每次运行成本约 **0.3-0.8 元**（取决于新闻长度）。

## 定时运行（可选）

每天自动运行，可使用 crontab（Linux/Mac）：

```bash
# 编辑 crontab
crontab -e

# 添加一行：每天早上 8:00 运行
0 8 * * * cd /path/to/backend && export DEEPSEEK_API_KEY="your-key" && python run.py >> /tmp/marketpulse.log 2>&1
```
