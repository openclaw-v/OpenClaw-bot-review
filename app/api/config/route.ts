import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 配置文件路径
const CONFIG_PATH = path.join(process.env.HOME || "", ".openclaw", "openclaw.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);

    // 提取 agents 信息
    const defaults = config.agents?.defaults || {};
    const defaultModel = typeof defaults.model === "string"
      ? defaults.model
      : defaults.model?.primary || "unknown";
    const fallbacks = typeof defaults.model === "object"
      ? defaults.model?.fallbacks || []
      : [];

    const agentList = config.agents?.list || [];
    const bindings = config.bindings || [];
    const channels = config.channels || {};
    const feishuAccounts = channels.feishu?.accounts || {};

    // 构建 agent 详情
    const agents = agentList.map((agent: any) => {
      const id = agent.id;
      const name = agent.name || id;
      const emoji = agent.identity?.emoji || "🤖";
      const model = agent.model || defaultModel;

      // 查找绑定的平台
      const platforms: { name: string; accountId?: string; appId?: string }[] = [];

      // 检查飞书绑定
      const feishuBinding = bindings.find(
        (b: any) => b.agentId === id && b.match?.channel === "feishu"
      );
      if (feishuBinding) {
        const accountId = feishuBinding.match?.accountId || id;
        const appId = feishuAccounts[accountId]?.appId;
        platforms.push({ name: "feishu", accountId, appId });
      }

      // main agent 特殊处理：默认绑定所有未显式绑定的 channel
      if (id === "main") {
        if (!feishuBinding && channels.feishu?.enabled) {
          const appId = feishuAccounts["main"]?.appId || channels.feishu?.appId;
          platforms.push({ name: "feishu", accountId: "main", appId });
        }
        if (channels.discord?.enabled) {
          platforms.push({ name: "discord" });
        }
      }

      return { id, name, emoji, model, platforms };
    });

    // 提取模型 providers
    const providers = Object.entries(config.models?.providers || {}).map(
      ([providerId, provider]: [string, any]) => {
        const models = (provider.models || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          contextWindow: m.contextWindow,
          maxTokens: m.maxTokens,
          reasoning: m.reasoning,
          input: m.input,
        }));

        // 找出使用该 provider 的 agents
        const usedBy = agents
          .filter((a: any) => a.model.startsWith(providerId + "/"))
          .map((a: any) => ({ id: a.id, emoji: a.emoji }));

        return {
          id: providerId,
          api: provider.api,
          models,
          usedBy,
        };
      }
    );

    return NextResponse.json({
      agents,
      providers,
      defaults: { model: defaultModel, fallbacks },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
