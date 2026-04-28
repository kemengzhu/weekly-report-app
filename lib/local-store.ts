"use client";

import { v4 as uuidv4 } from "uuid";

export type BehaviorEventType =
  | "expand_request"
  | "expand_success"
  | "quick_note_saved"
  | "generate_click"
  | "weekly_stream_start"
  | "weekly_stream_success"
  | "weekly_stream_fail"
  | "report_deleted"
  | "template_favorited";

export type BehaviorEvent = {
  id: string;
  type: BehaviorEventType;
  label: string;
  createdAt: string;
  meta?: Record<string, string | number | boolean>;
};

export type QuickNote = {
  id: string;
  raw: string;
  expanded: string;
  createdAt: string;
};

export type WeeklyReport = {
  id: string;
  title: string;
  tone: string;
  dimensions: string[];
  content: string;
  createdAt: string;
};

export type FavoriteTemplate = {
  id: string;
  name: string;
  tone: string;
  dimensions: string[];
  content: string;
  createdAt: string;
};

export type DeepseekModelPreset = "basic" | "reasoner";

const KEYS = {
  events: "weekflow.events",
  quickNotes: "weekflow.quickNotes",
  reports: "weekflow.reports",
  templates: "weekflow.templates",
  modelPreset: "weekflow.modelPreset",
  quotaUsage: "weekflow.quotaUsage",
} as const;

export const LOCAL_STORE_UPDATED_EVENT = "weekflow:local-store-updated";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readJSON<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent(LOCAL_STORE_UPDATED_EVENT, {
      detail: { key },
    }),
  );
}

export function listEvents() {
  return readJSON<BehaviorEvent[]>(KEYS.events, []);
}

export function trackEvent(
  type: BehaviorEventType,
  label: string,
  meta?: Record<string, string | number | boolean>,
) {
  const next: BehaviorEvent = {
    id: uuidv4(),
    type,
    label,
    createdAt: new Date().toISOString(),
    meta,
  };
  const events = listEvents();
  writeJSON(KEYS.events, [next, ...events].slice(0, 300));
}

export function listQuickNotes() {
  return readJSON<QuickNote[]>(KEYS.quickNotes, []);
}

export function addQuickNote(raw: string, expanded: string) {
  const notes = listQuickNotes();
  const next: QuickNote = {
    id: uuidv4(),
    raw,
    expanded,
    createdAt: new Date().toISOString(),
  };
  writeJSON(KEYS.quickNotes, [next, ...notes].slice(0, 50));
  return next;
}

export function listReports() {
  return readJSON<WeeklyReport[]>(KEYS.reports, []);
}

export function addReport(report: Omit<WeeklyReport, "id" | "createdAt">) {
  const reports = listReports();
  const next: WeeklyReport = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...report,
  };
  writeJSON(KEYS.reports, [next, ...reports]);
  return next;
}

export function deleteReport(reportId: string) {
  const reports = listReports().filter((item) => item.id !== reportId);
  writeJSON(KEYS.reports, reports);
}

export function listTemplates() {
  return readJSON<FavoriteTemplate[]>(KEYS.templates, []);
}

export function addTemplate(template: Omit<FavoriteTemplate, "id" | "createdAt">) {
  const templates = listTemplates();
  const next: FavoriteTemplate = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...template,
  };
  writeJSON(KEYS.templates, [next, ...templates].slice(0, 20));
  return next;
}

export function getModelPreset(): DeepseekModelPreset {
  const preset = readJSON<DeepseekModelPreset | null>(KEYS.modelPreset, null);
  return preset === "reasoner" ? "reasoner" : "basic";
}

export function setModelPreset(preset: DeepseekModelPreset) {
  writeJSON(KEYS.modelPreset, preset);
}

export function getQuotaUsageCount() {
  return readJSON<number>(KEYS.quotaUsage, 0);
}

export function increaseQuotaUsageCount(step = 1) {
  const current = getQuotaUsageCount();
  const next = current + Math.max(0, step);
  writeJSON(KEYS.quotaUsage, next);
  return next;
}
