# Agent Skills 索引

本目录存放智能体技能文件。智能体启动分析前先读此索引，按需加载匹配自身角色的技能。

## 使用规则
- `tags: [all]` 表示所有智能体均应加载
- `tags: [agent_id, ...]` 表示仅该角色加载
- `priority: high` 的技能内容将优先注入

## 技能清单

| skill_id | file | tags | priority | description |
|----------|------|------|----------|-------------|
| pyramid_principle | pyramid_principle.md | all | high | 金字塔原则：结论先行、MECE、So What?测试 |
| feishu_context_usage | feishu_context_usage.md | all | high | 飞书上下文深度利用：日历/任务/文档三类数据提取规则 |
| data_analysis_methods | data_analysis_methods.md | data_analyst,finance_advisor | high | 数据分析方法论：指标拆解、归因分析、异常检测 |
| financial_analysis | financial_analysis.md | finance_advisor | normal | 财务分析技能：健康指标、现金流、成本结构诊断 |
| product_thinking | product_thinking.md | product_manager | normal | 产品思维：ICE优先级、用户价值、路线图决策框架 |
| seo_growth | seo_growth.md | seo_advisor | normal | SEO增长技能：关键词机会评估、流量结构分析框架 |
| content_strategy | content_strategy.md | content_manager | normal | 内容策略技能：内容资产盘点、复用框架、缺口识别 |
| executive_summary | executive_summary.md | ceo_assistant | high | 管理层摘要写法：信号萃取、跨模块决策优先级排序 |
| feishu_doc_output | feishu_doc_output.md | all | high | 飞书文档格式规范：引用块/任务列表/表格/数值呈现/操作提示 |
| weekly_report_writing | weekly_report_writing.md | data_analyst,finance_advisor,ceo_assistant | high | 周报写作：红绿灯指标/异常解读3问/进展描述模板/风险分级 |
| meeting_preparation | meeting_preparation.md | product_manager,operations_manager,ceo_assistant | high | 会议准备：SCQA议题框架/Pre-Read结构/决策选项/时间分配 |
| sprint_retrospective | sprint_retrospective.md | product_manager,operations_manager | normal | 迭代复盘：4L回顾/5 Why根因/MoSCoW优先级/Velocity判断 |
| growth_funnel | growth_funnel.md | data_analyst,seo_advisor,content_manager | high | 增长漏斗：AARRR分层/渠道ROI矩阵/北极星指标/瓶颈诊断树 |
| operations_execution | operations_execution.md | operations_manager | normal | 运营执行：四象限优先级/OKR对齐检查/跨团队风险/追踪报告 |
| business_diagnosis | business_diagnosis.md | data_analyst,finance_advisor,ceo_assistant | high | 经营诊断：收入成本利润三角/KPI异常规则/季节性调整/五问框架 |
