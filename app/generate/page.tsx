"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addReport,
  addTemplate,
  getModelPreset,
  increaseQuotaUsageCount,
  trackEvent,
  type DeepseekModelPreset,
} from "@/lib/local-store";

const DIMENSION_OPTIONS = ["目标进展", "项目推进", "协同沟通", "风险复盘", "下周计划"];

export default function GeneratePage() {
  const [title, setTitle] = useState("WeekFlow 本周工作周报");
  const [tone, setTone] = useState("专业简洁");
  const [dimensions, setDimensions] = useState<string[]>(["目标进展", "下周计划"]);
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelPreset, setModelPreset] = useState<DeepseekModelPreset>("basic");
  const resultRef = useRef<HTMLDivElement>(null);

  const dimensionLabel = useMemo(() => dimensions.join("、"), [dimensions]);

  useEffect(() => {
    setModelPreset(getModelPreset());
  }, []);

  function toggleDimension(item: string) {
    setDimensions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function handleGenerate() {
    if (!context.trim()) {
      toast.error("请输入本周工作素材");
      return;
    }
    if (!dimensions.length) {
      toast.error("至少选择一个维度");
      return;
    }
    trackEvent("weekly_stream_start", "开始流式生成周报");
    increaseQuotaUsageCount();
    const currentModel = getModelPreset();
    setModelPreset(currentModel);
    setResult("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tone,
          dimensions,
          context,
          modelPreset: currentModel,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error("周报生成失败");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let finalText = "";
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          const text = decoder.decode(chunk.value, { stream: true });
          finalText += text;
          setResult(finalText);
        }
      }

      addReport({
        title,
        tone,
        dimensions,
        content: finalText,
      });
      trackEvent("weekly_stream_success", "流式生成成功");
      toast.success("周报生成完成并已写入历史");
    } catch (error) {
      trackEvent("weekly_stream_fail", "流式生成失败");
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result.trim()) return;
    await navigator.clipboard.writeText(result);
    toast.success("已复制到剪贴板");
  }

  async function shareAsImage() {
    if (!resultRef.current) return;
    const url = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekflow-report.png";
    a.click();
    toast.success("图片已导出");
  }

  function favoriteTemplate() {
    if (!result.trim()) {
      toast.error("先生成一份周报再收藏模板");
      return;
    }
    addTemplate({
      name: `${tone} · ${new Date().toLocaleDateString()}`,
      tone,
      dimensions,
      content: result,
    });
    trackEvent("template_favorited", "收藏模板");
    toast.success("模板已收藏");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>周报配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="周报标题" />
          <Select value={tone} onValueChange={(value) => value && setTone(value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择语气" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="专业简洁">专业简洁</SelectItem>
              <SelectItem value="数据导向">数据导向</SelectItem>
              <SelectItem value="复盘反思">复盘反思</SelectItem>
              <SelectItem value="高管汇报">高管汇报</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">维度（可多选）</p>
            <Tabs defaultValue={DIMENSION_OPTIONS[0]}>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-3">
                {DIMENSION_OPTIONS.map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    onClick={() => toggleDimension(item)}
                    className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              {dimensions.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>

          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="输入素材，例如：完成埋点、发布新版本、跨部门同步..."
          />
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "正在流式生成..." : "开始生成周报"}
          </Button>
          <p className="text-xs text-muted-foreground">
            当前模型：{modelPreset === "reasoner" ? "深度思考" : "基础模型"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
          <p className="text-sm text-muted-foreground">
            语气：{tone} ｜维度：{dimensionLabel}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div ref={resultRef} className="min-h-48 rounded-md border bg-muted/20 p-4">
            {result ? (
              <article className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">生成内容会显示在这里。</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyResult}>
              复制
            </Button>
            <Button variant="secondary" onClick={shareAsImage}>
              分享为图片
            </Button>
            <Button variant="secondary" onClick={favoriteTemplate}>
              收藏模板
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
