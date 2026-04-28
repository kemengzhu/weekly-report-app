import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

function fallbackWeeklyReport(input: {
  title: string;
  tone: string;
  dimensions: string[];
  context: string;
}) {
  const { title, tone, dimensions, context } = input;
  return [
    `# ${title}`,
    "",
    `> 语气：${tone}`,
    `> 维度：${dimensions.join("、")}`,
    "",
    "## 本周完成",
    `- 围绕以下事项推进：${context}`,
    "- 已形成阶段性结果，并完成关键同步。",
    "",
    "## 风险与问题",
    "- 当前外部接口稳定性存在波动，建议预留缓冲时间。",
    "- 跨团队依赖项建议提前锁定负责人与时间点。",
    "",
    "## 下周计划",
    "- 聚焦高优先级任务闭环，按日跟踪关键指标。",
    "- 对本周问题进行复盘，形成可复用执行模板。",
  ].join("\n");
}

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
});

function resolveModel(preset?: string) {
  return preset === "reasoner" ? "deepseek-reasoner" : "deepseek-chat";
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    tone?: string;
    dimensions?: string[];
    context?: string;
    modelPreset?: string;
  };

  const title = body.title?.trim() || "本周工作周报";
  const tone = body.tone?.trim() || "专业简洁";
  const dimensions = body.dimensions?.length ? body.dimensions : ["目标进展", "下周计划"];
  const context = body.context?.trim();
  const modelId = resolveModel(body.modelPreset);

  if (!context) {
    return new Response("缺少 context 参数", { status: 400 });
  }

  if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    return new Response(
      fallbackWeeklyReport({ title, tone, dimensions, context }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  try {
    const result = streamText({
      model: deepseek.chat(modelId),
      system: [
        "你是中文周报助手，输出结构清晰、可直接给主管阅读。",
        "使用 Markdown 格式，标题后分段说明本周完成、问题与下周计划。",
        "不捏造事实，不生成与输入无关内容。",
      ].join("\n"),
      prompt: [
        `标题：${title}`,
        `语气：${tone}`,
        `维度：${dimensions.join("、")}`,
        `素材：${context}`,
        "请输出完整周报正文。",
      ].join("\n"),
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response(
      fallbackWeeklyReport({ title, tone, dimensions, context }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}
