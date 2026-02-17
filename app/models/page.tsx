"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  input: string[];
}

interface Provider {
  id: string;
  api: string;
  models: Model[];
  usedBy: { id: string; emoji: string }[];
}

interface ConfigData {
  providers: Provider[];
  defaults: { model: string; fallbacks: string[] };
}

// 格式化数字
function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function ModelsPage() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">加载失败: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-muted)]">加载中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🧠 模型 Provider 列表
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            共 {data.providers.length} 个 Provider
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm font-medium hover:border-[var(--accent)] transition"
        >
          ← 返回总览
        </Link>
      </div>

      <div className="space-y-6">
        {data.providers.map((provider) => (
          <div
            key={provider.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{provider.id}</h2>
                <span className="text-xs text-[var(--text-muted)]">
                  API: {provider.api}
                </span>
              </div>
              {provider.usedBy.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-muted)] mr-1">使用中:</span>
                  {provider.usedBy.map((a) => (
                    <span key={a.id} title={a.id} className="text-lg">
                      {a.emoji}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {provider.models.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
                      <th className="text-left py-2 pr-4">模型 ID</th>
                      <th className="text-left py-2 pr-4">名称</th>
                      <th className="text-left py-2 pr-4">上下文窗口</th>
                      <th className="text-left py-2 pr-4">最大输出</th>
                      <th className="text-left py-2 pr-4">输入类型</th>
                      <th className="text-left py-2">推理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provider.models.map((m) => (
                      <tr key={m.id} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 font-mono text-[var(--accent)]">{m.id}</td>
                        <td className="py-2 pr-4">{m.name}</td>
                        <td className="py-2 pr-4">{formatNum(m.contextWindow)}</td>
                        <td className="py-2 pr-4">{formatNum(m.maxTokens)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-1">
                            {(m.input || []).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-xs"
                              >
                                {t === "text" ? "📝" : "🖼️"} {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2">{m.reasoning ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-sm">
                无显式模型定义（通过 provider 名称推断）
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
