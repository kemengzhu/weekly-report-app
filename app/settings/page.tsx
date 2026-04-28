"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getModelPreset,
  getQuotaUsageCount,
  listTemplates,
  LOCAL_STORE_UPDATED_EVENT,
  setModelPreset,
  type DeepseekModelPreset,
} from "@/lib/local-store";

const FREE_LIMIT = 20;

export default function SettingsPage() {
  const [quotaUsageCount, setQuotaUsageCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [modelPreset, setModelPresetState] = useState<DeepseekModelPreset>("basic");

  function refreshLocalStats() {
    setQuotaUsageCount(getQuotaUsageCount());
    setTemplateCount(listTemplates().length);
    setModelPresetState(getModelPreset());
  }

  useEffect(() => {
    refreshLocalStats();

    const onStoreUpdated = () => refreshLocalStats();
    const onStorage = () => refreshLocalStats();
    const onVisibilityChange = () => {
      if (!document.hidden) refreshLocalStats();
    };

    window.addEventListener(LOCAL_STORE_UPDATED_EVENT, onStoreUpdated);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener(LOCAL_STORE_UPDATED_EVENT, onStoreUpdated);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const freeLeft = Math.max(0, FREE_LIMIT - quotaUsageCount);
  const freeUsage = useMemo(
    () => Math.min(100, Math.round((quotaUsageCount / FREE_LIMIT) * 100)),
    [quotaUsageCount],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>账户与配额</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>免费生成次数</span>
            <Badge>{freeLeft} 次剩余</Badge>
          </div>
          <Progress value={freeUsage} />
          <p className="text-xs text-muted-foreground">
            已使用 {quotaUsageCount}/{FREE_LIMIT} 次，本地收藏模板 {templateCount} 个。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI 模型设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={modelPreset}
            onValueChange={(value) => {
              const preset = value === "reasoner" ? "reasoner" : "basic";
              setModelPresetState(preset);
              setModelPreset(preset);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择 DeepSeek 模型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">基础模型（deepseek-chat）</SelectItem>
              <SelectItem value="reasoner">深度思考（deepseek-reasoner）</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            当前默认：{modelPreset === "reasoner" ? "深度思考" : "基础模型"}。首页扩写与周报生成都会使用该设置。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>假付费套餐（演示）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border p-3">
            <p className="font-medium">Starter · ¥29/月</p>
            <p className="text-sm text-muted-foreground">每月 100 次生成，2 种语气模板。</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="font-medium">Pro · ¥99/月</p>
            <p className="text-sm text-muted-foreground">每月 500 次生成，支持图片导出与模板库。</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="font-medium">Team · ¥299/月</p>
            <p className="text-sm text-muted-foreground">团队协作、统一模板、导出审计日志。</p>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">仅用于产品原型演示，不会实际扣费。</p>
        </CardContent>
      </Card>
    </div>
  );
}
