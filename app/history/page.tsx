"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteReport, listReports, trackEvent, type WeeklyReport } from "@/lib/local-store";

export default function HistoryPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    setReports(listReports());
  }, []);

  function handleDelete(id: string) {
    deleteReport(id);
    trackEvent("report_deleted", "删除历史周报");
    setReports(listReports());
    toast.success("已删除历史周报");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>历史周报</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">共 {reports.length} 条记录，存储于本地浏览器。</p>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            暂无历史周报，去「生成」页面创建第一份吧。
          </CardContent>
        </Card>
      ) : null}

      {reports.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>{item.title}</span>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                删除
              </Button>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{item.tone}</Badge>
              {item.dimensions.map((dimension) => (
                <Badge key={dimension} variant="outline">
                  {dimension}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <article className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
