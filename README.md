# WeekFlow - AI 周报生成器

WeekFlow 是一个基于 Next.js 14 构建的 AI 周报工具，帮助你用碎片化工作记录快速生成结构化周报。
项目支持 DeepSeek 模型选择、流式生成、历史管理、模板收藏，并内置行为数据调试面板。

## 功能简介

- 首页快捷扩写：输入一句工作记录，调用 AI 扩写成周报素材
- 周报流式生成：按语气和维度生成完整 Markdown 周报
- 模型可选：支持 `deepseek-chat`（基础）与 `deepseek-reasoner`（深度思考）
- 历史记录：本地查看与删除历史周报
- 模板收藏：将高质量结果保存为本地模板
- 配额展示：按“生成请求次数”统计免费额度（与历史条数解耦）
- 调试面板：`/?debug=true` 下展示行为数据与漏斗图

## 技术栈

- Next.js 14（App Router）
- React + TypeScript
- Tailwind CSS + shadcn/ui
- AI SDK（`ai` + `@ai-sdk/openai`，对接 DeepSeek 兼容接口）
- Recharts（行为数据可视化）
- react-hot-toast（交互提示）
- localStorage（前端本地数据存储）

## 项目结构

```text
app/
  api/ai/expand/route.ts      # AI 扩写接口
  api/ai/weekly/route.ts      # AI 周报流式生成接口
  page.tsx                    # 首页（扩写 + 进度 + 调试面板）
  generate/page.tsx           # 生成页
  history/page.tsx            # 历史页
  settings/page.tsx           # 设置页（配额 + 模型）
lib/
  local-store.ts              # 本地存储与业务状态管理
components/
  bottom-nav.tsx              # 底部导航
```

## 环境变量

在项目根目录创建 `.env.local`：

```env
DEEPSEEK_API_KEY=你的DeepSeekKey
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

> 兼容说明：若未配置 `DEEPSEEK_API_KEY`，代码会回退尝试 `OPENAI_API_KEY`。

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问：

- 默认首页：[http://localhost:3000](http://localhost:3000)
- 若 3000 被占用，Next.js 会自动切换到 3001（终端会显示实际端口）

## 使用说明

### 1) 首页扩写

1. 在首页输入一句工作记录
2. 点击“AI扩写”
3. 得到扩写结果后，可“保存快捷记录”

### 2) 生成周报

1. 进入“生成”页
2. 配置标题、语气、维度
3. 填写本周素材并点击“开始生成周报”
4. 支持复制、图片导出、收藏模板

### 3) 设置模型与查看配额

1. 进入“设置”页
2. 选择 DeepSeek 模型（基础/深度思考）
3. 查看免费额度（按生成请求次数累计）

## 调试模式

在 URL 后追加 `?debug=true`：

```text
http://localhost:3000/?debug=true
```

可在首页底部看到行为统计与漏斗图（基于本地事件数据）。

## 常见问题

### Q1: 扩写/生成走了本地兜底文本？

通常是以下原因：

- Key 未配置或无效
- 模型账户余额不足（如 `Insufficient Balance`）
- 网络无法连接 API

### Q2: 删除历史后配额会变吗？

不会。当前配额按“生成请求次数”统计，已与历史记录条数解耦。

## License

仅用于学习与原型演示。商业使用前请自行评估模型服务成本、数据合规与安全策略。
