# AgriAgent 🌾 — 基于大模型技术的农业智能体

> 基于 [Claude Code](https://github.com/claude-code-best/claude-code) 反编译项目改造的农业领域专用智能体。

## 项目定位

AgriAgent 是一个面向水稻生长与甲烷排放模拟的多智能体系统，通过 MCP 协议集成农业机理模型，让用户可以用自然语言完成作物模拟与排放估算。

## 核心功能

- 🌾 **水稻生长模拟** — 调用 RiceGrow 模型，模拟生物量、产量、生育期
- 💨 **甲烷排放估算** — 调用 CH4MOD 模型，估算稻田 CH₄ 排放
- 🌱 **通用作物模拟** — 调用 SIMPLE 模型，支持多作物
- 📊 **结果分析与可视化** — 自动生成模拟报告和图表

## 技术架构

```
AgriAgent (TypeScript Agent 框架)
  ├── MCP Tool: ricegrow-simulator (Python)
  ├── MCP Tool: ch4-simulator (Python)
  ├── MCP Tool: simple-crop-simulator (Python)
  ├── Skill: crop-analysis
  └── Agent: crop-coordinator
```

## 硕士论文课题

**基于大模型技术的农业智能体研究** — 南京农业大学

## 版本

- v0.1.0-alpha — 品牌改造阶段
