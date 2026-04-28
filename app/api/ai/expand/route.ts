import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

function fallbackExpand(text: string) {
  return [
    `本周围绕「${text}」推进了核心工作，并完成了阶段性交付。`,
    "在执行过程中持续同步进展，确保相关同学对目标、节奏和结果有统一认知。",
    "目前关键事项已进入稳定推进阶段，为后续周报沉淀提供了清晰输入。",
  ].join("");
}

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
});

function resolveModel(preset?: string) {
  return preset === "reasoner" ? "deepseek-reasoner" : "deepseek-chat";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string; modelPreset?: string };
  const text = body.text?.trim();
  const modelId = resolveModel(body.modelPreset);
  if (!text) {
    return NextResponse.json({ error: "缺少 text 参数" }, { status: 400 });
  }

  try {
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        text: fallbackExpand(text),
        fallback: true,
        reason: "未配置 DEEPSEEK_API_KEY/OPENAI_API_KEY，已使用本地扩写",
      });
    }

    const result = await generateText({
      model: deepseek.chat(modelId),
      prompt: [
        "请将以下工作记录扩写为更清晰、适合周报素材的 3-5 句中文描述。",
        "要求：保留事实，不编造数字，语气专业。",
        `原始记录：${text}`,
      ].join("\n"),
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    return NextResponse.json({
      text: fallbackExpand(text),
      fallback: true,
      reason: error instanceof Error ? error.message : "调用 AI 超时，已使用本地扩写",
    });
  }
}
