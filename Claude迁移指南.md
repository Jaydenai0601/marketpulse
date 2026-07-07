# 迁移到 Claude 操作指南

## 第一步：下载项目文件

你需要把以下文件下载到自己电脑，然后上传给 Claude：

| 文件/文件夹 | 说明 |
|------------|------|
| `index.html` | 前端网站（主文件） |
| `backend/` 文件夹 | 后端脚本（crawler.py, analyzer.py, run.py, requirements.txt） |
| `data/` 文件夹 | 数据文件（daily_data.json, history.json） |
| `财经新闻情绪分析_Prompt模板.md` | Prompt 模板 |

### 下载方法：

在 TRAE 左侧文件栏，右键点击文件 → 「下载」即可保存到本地。

## 第二步：在 Claude 上继续

### 方案 A：把前端交给 Claude 优化（推荐）

直接把 `index.html` 的内容复制粘贴到 Claude，然后说：

> "请帮我优化这个前端网站：
> 1. 把模拟数据改成从 JSON 文件读取
> 2. 增加移动端适配
> 3. 增加日期切换功能，可以查看不同日期的日报
> 4. 整体风格保持暗色简约"

### 方案 B：把后端交给 Claude 优化

把 `backend/` 里的 4 个文件上传给 Claude，然后说：

> "请帮我完善这个财经新闻情绪分析系统：
> 1. 爬虫目前只抓标题，请增加正文抓取
> 2. 增加错误处理和重试机制
> 3. 优化 Prompt 让分析更精准
> 4. 增加日志记录"

### 方案 C：前后端一起交给 Claude

把全部文件打包成 zip 上传，告诉 Claude：

> "这是一个财经新闻情绪分析项目，包含前端网站和后端脚本。
> 请帮我：
> 1. 让前端能自动读取后端生成的 JSON 数据
> 2. 优化整体代码结构
> 3. 增加部署到 Vercel 的配置"

## 第三步：获取 DeepSeek API Key（Claude 也需要）

 Claude 不能帮你注册 API，你需要自己：

1. 访问 https://platform.deepseek.com
2. 注册账号 → 创建 API Key
3. 把 Key 保存好，运行脚本时设置环境变量

## 给 Claude 的提示词建议

如果你不知道怎么跟 Claude 描述需求，直接复制这段：

```
我正在做一个财经新闻情绪分析产品，叫 MarketPulse。

【产品功能】
- 每天自动抓取东方财富、新浪财经的财经新闻
- 用 DeepSeek 大模型逐条分析新闻情绪（利好/利空/中性、强度、影响板块）
- 生成可视化的市场情绪日报
- 通过网站展示：情绪指数、板块热力图、Top 3 驱动事件、历史趋势

【当前状态】
- 前端网站已搭好（暗色简约风格），但用的是模拟数据
- 后端脚本已写好（爬虫 + AI分析），能生成 JSON 数据
- 需要把前后端打通，让网站展示真实数据

【请帮我】
1. 优化前端，让它能读取 JSON 数据文件
2. 增加交互功能：日期切换、板块详情展开
3. 确保移动端显示正常
4. 给出部署到 Vercel 的步骤
```

## 文件清单

如果你要打包给 Claude，确保包含这些：

```
marketpulse/
├── index.html              # 前端网站
├── backend/
│   ├── crawler.py          # 新闻爬虫
│   ├── analyzer.py         # AI 情绪分析
│   ├── run.py              # 主运行脚本
│   ├── requirements.txt    # Python 依赖
│   └── README.md           # 使用说明
├── data/
│   ├── daily_data.json     # 当日数据
│   └── history.json        # 历史数据
├── 财经新闻情绪分析_Prompt模板.md
└── 操作指南.md
```

## 在 Claude 上的执行步骤

1. 把后端文件上传到 Claude
2. 告诉 Claude 你的 DeepSeek API Key（或让它告诉你怎么设置）
3. 让 Claude 帮你运行 `python run.py`
4. 把生成的 `daily_data.json` 交给前端
5. 让 Claude 帮你部署网站

---

**需要我把这些文件打包成一个 zip 吗？** 这样你直接下载上传给 Claude 更方便。
