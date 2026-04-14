# MultiAgent Lark

> 飞书 AI 挑战赛参赛项目 —— 基于 MetaGPT + OpenManus 构建的 AI 企业管理平台

## 项目简介

本项目是一个面向企业的 AI 管理平台，用户可以在前端通过交互方式，自定义选择并调用不同的 AI Agent，借助飞书生态（文档、多维表格、消息、任务、知识库）完成企业的运营管理。

**核心设计理念：**
- 用户在前端选择需要的 Agent 组合
- Agent 之间通过 MetaGPT SOP 框架协同协作
- OpenManus 负责具体工具执行（飞书 CLI + API）
- 所有产出实时同步到飞书

## 技术栈

- **[MetaGPT](https://github.com/FoundationAgents/MetaGPT)** — 多智能体 SOP 框架，负责角色分工与任务规划
- **[OpenManus](https://github.com/FoundationAgents/OpenManus)** — 通用 Agent 执行框架，负责工具调用与飞书操作
- **飞书开放平台** — 业务产出平台（文档、多维表格、消息、任务）

## 子模块

```
multiagent-lark/
├── MetaGPT/      # FoundationAgents/MetaGPT
└── OpenManus/    # FoundationAgents/OpenManus
```

## 快速开始

```bash
git clone --recurse-submodules https://github.com/shuaigexly/multiagent-lark.git
cd multiagent-lark
```

## 赛道

飞书 AI 实战挑战赛 · 开放创新赛道
