"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Platform {
  name: string;
  accountId?: string;
  appId?: string;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  platforms: Platform[];
}

interface ConfigData {
  agents: Agent[];
  defaults: { model: string; fallbacks: string[] };
}

// 平台标签颜色
function PlatformBadge({ platform }: { platform: Platform }) {
  const isFeishu = platform.name === "feishu";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isFeishu
          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
      }`}
    >
      {isFeishu ? "📱 飞书" : "🎮 Discord"}
      {platform.accountId && (
        <span className="opacity-60">({platform.accountId})</span>
      )}
    </span>
  );
}

// 模型标签
function ModelBadge({ model }: { model: string }) {
  const [provider, modelName] = model.includes("/")
    ? model.split("/", 2)
    : ["default", model];

  const colors: Record<string, string> = {
    "yunyi-claude": "bg-green-500/20 text-green-300 border-green-500/30",
    minimax: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    volcengine: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    bailian: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        colors[provider] || "bg-gray-500/20 text-gray-300 border-gray-500/30"
      }`}
    >
      🧠 {modelName}
    </span>
  );
}

// Agent 卡片
function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{agent.emoji}</span>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">{agent.name}</h3>
          <span className="text-xs text-[var(--text-muted)]">ID: {agent.id}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs text-[var(--text-muted)] block mb-1">模型</span>
          <ModelBadge model={agent.model} />
        </div>

        <div>
          <span className="text-xs text-[var(--text-muted)] block mb-1">平台</span>
          <div className="flex flex-wrap gap-1">
            {agent.platforms.map((p, i) => (
              <PlatformBadge key={i} platform={p} />
            ))}
          </div>
        </div>

        {agent.platforms.some((p) => p.appId) && (
          <div>
            <span className="text-xs text-[var(--text-muted)] block mb-1">飞书 App ID</span>
            <code className="text-xs text-[var(--accent)] bg-[var(--bg)] px-2 py-0.5 rounded">
              {agent.platforms.find((p) => p.appId)?.appId}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
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
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🐾 OpenClaw Bot Dashboard
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            共 {data.agents.length} 个机器人 · 默认模型: {data.defaults.model}
          </p>
        </div>
        <Link
          href="/models"
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition"
        >
          查看模型列表 →
        </Link>
      </div>

      {/* 卡片墙 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Fallback 信息 */}
      {data.defaults.fallbacks.length > 0 && (
        <div className="mt-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-2">
            🔄 Fallback 模型
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.defaults.fallbacks.map((f, i) => (
              <ModelBadge key={i} model={f} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
