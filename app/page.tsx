"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  Funnel,
  FunnelChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  addQuickNote,
  type BehaviorEvent,
  getModelPreset,
  listEvents,
  listReports,
  trackEvent,
} from "@/lib/local-store";

const WEEKLY_TARGET = 5;

export default function HomePage() {
  const [quickText, setQuickText] = useState("");
  const [expandedText, setExpandedText] = useState("");
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [reportCount, setReportCount] = useState(() => listReports().length);
  const [refreshKey, setRefreshKey] = useState(0);
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [isDebug, setIsDebug] = useState(false);
  const [modelPreset, setModelPreset] = useState<"basic" | "reasoner">("basic");

  useEffect(() => {
    setEvents(listEvents());
  }, [refreshKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDebug(params.get("debug") === "true");
    setModelPreset(getModelPreset());
  }, []);
  const eventChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of events) {
      map.set(item.type, (map.get(item.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }, [events]);

  const funnelData = useMemo(() => {
    const view = events.filter((item) => item.type === "generate_click").length + 1;
    const start = events.filter((item) => item.type === "weekly_stream_start").length;
    const success = events.filter((item) => item.type === "weekly_stream_success").length;
    return [
      { name: "进入首页", value: view },
      { name: "点击生成", value: Math.max(start, 1) },
      { name: "生成成功", value: Math.max(success, 0) },
    ];
  }, [events]);

  async function handleExpand() {
    if (!quickText.trim()) {
      toast.error("请先输入一句本周关键进展");
      return;
    }
    trackEvent("expand_request", "首页请求扩写");
    const currentModel = getModelPreset();
    setModelPreset(currentModel);
    setRefreshKey((value) => value + 1);
    setLoadingExpand(true);
    try {
      const response = await fetch("/api/ai/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quickText, modelPreset: currentModel }),
      });
      if (!response.ok) throw new Error("扩写失败");
      const data = (await response.json()) as { text: string };
      setExpandedText(data.text);
      trackEvent("expand_success", "首页扩写成功");
      setRefreshKey((value) => value + 1);
      toast.success("扩写完成");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "扩写失败");
    } finally {
      setLoadingExpand(false);
    }
  }

  function saveQuickRecord() {
    if (!quickText.trim() || !expandedText.trim()) {
      toast.error("先完成扩写后再保存");
      return;
    }
    addQuickNote(quickText, expandedText);
    trackEvent("quick_note_saved", "保存快捷记录");
    setRefreshKey((value) => value + 1);
    setQuickText("");
    setExpandedText("");
    toast.success("已保存到快捷记录");
  }

  const progress = Math.min(100, Math.round((reportCount / WEEKLY_TARGET) * 100));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>WeekFlow · AI周报生成器</span>
            <Badge variant="secondary">本周目标 {WEEKLY_TARGET} 篇</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={quickText}
            onChange={(event) => setQuickText(event.target.value)}
            placeholder="例：完成用户分层策略和埋点重构。"
            rows={4}
          />
          <div className="flex gap-2">
            <Button onClick={handleExpand} disabled={loadingExpand}>
              {loadingExpand ? "扩写中..." : "AI扩写"}
            </Button>
            <Button variant="secondary" onClick={saveQuickRecord}>
              保存快捷记录
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            当前模型：{modelPreset === "reasoner" ? "深度思考" : "基础模型"}
          </p>
          {expandedText ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm leading-6">
              {expandedText}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>本周进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            已累计 {reportCount} 篇周报，完成度 {progress}%
          </p>
          <Separator />
          <Link href="/generate">
            <Button
              className="w-full"
              onClick={() => {
                trackEvent("generate_click", "首页点击去生成");
                setReportCount(listReports().length);
                setRefreshKey((value) => value + 1);
              }}
            >
              进入周报生成
            </Button>
          </Link>
        </CardContent>
      </Card>

      {isDebug ? (
        <Card>
          <CardHeader>
            <CardTitle>调试面板（行为数据 & 漏斗）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventChartData}>
                  <XAxis dataKey="type" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive />
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
