import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FeishuAssetCard from '../components/FeishuAssetCard';
import { getTaskResults, publishTask } from '../services/api';
import type { TaskResultsResponse } from '../services/types';

const STATUS_META: Record<string, { label: string; className: string }> = {
  done: { label: '已完成', className: 'badge-success' },
  running: { label: '执行中', className: 'badge-warning' },
  failed: { label: '失败', className: 'badge-error' },
  pending: { label: '等待中', className: 'badge-neutral' },
};

const PUBLISH_OPTIONS = [
  { value: 'doc', label: '飞书文档', description: '生成完整分析报告' },
  { value: 'bitable', label: '多维表格', description: '同步行动项与结构化数据' },
  { value: 'message', label: '群消息', description: '发送管理层摘要通知' },
  { value: 'task', label: '飞书任务', description: '将行动项转成待办任务' },
];

export default function ResultView() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<TaskResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishTypes, setPublishTypes] = useState<string[]>(['doc', 'task']);
  const [docTitle, setDocTitle] = useState('');
  const [chatId, setChatId] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    getTaskResults(taskId)
      .then((response) => {
        setData(response);
        setExpandedAgent(response.agent_results[0]?.agent_id ?? null);
      })
      .catch(() => setError('加载结果失败'))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handlePublish = async () => {
    if (!taskId) {
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      await publishTask(taskId, publishTypes, {
        docTitle: docTitle || undefined,
        chatId: chatId || undefined,
      });
      const refreshed = await getTaskResults(taskId);
      setData(refreshed);
    } catch {
      setError('发布失败，请检查飞书配置');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="spinner" />
          <span>正在加载任务结果...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <div>
            <div className="empty-state-illustration">📄</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600 }}>
              任务结果不存在
            </div>
            <div style={{ marginTop: '8px' }}>这个任务可能尚未完成，或 ID 无效。</div>
            <button type="button" className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
              返回工作台
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_META[data.status] ?? { label: data.status, className: 'badge-neutral' };

  return (
    <div className="page-shell">
      <div className="result-grid">
        <header className="page-header">
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              ← 返回
            </button>
            <div style={{ marginTop: '18px' }}>
              <div className="page-title">{data.task_type_label}结果报告</div>
              <div className="page-subtitle">任务 ID: {data.task_id}</div>
            </div>
          </div>
          <span className={`badge ${status.className}`}>{status.label}</span>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {data.result_summary ? (
          <section className="card summary-card">
            <div className="section-heading">
              <div>
                <div className="section-title">摘要</div>
                <div className="section-copy">高层结论与优先动作。</div>
              </div>
            </div>
            <div className="section-block-copy" style={{ color: 'var(--text)' }}>
              {data.result_summary}
            </div>
          </section>
        ) : null}

        <section>
          <div className="section-heading">
            <div>
              <div className="section-title">Agent Results</div>
              <div className="section-copy">展开任意模块，查看完整分析内容与行动项。</div>
            </div>
          </div>

          <div className="accordion-list">
            {data.agent_results.map((result) => {
              const open = expandedAgent === result.agent_id;

              return (
                <article key={result.agent_id} className={`accordion-item${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="accordion-trigger"
                    onClick={() => setExpandedAgent(open ? null : result.agent_id)}
                  >
                    <div className="accordion-main">
                      <div className="agent-avatar">{result.agent_name.slice(0, 1).toUpperCase()}</div>
                      <div>
                        <div className="accordion-name">{result.agent_name}</div>
                        <div className="accordion-meta">
                          {result.sections.length} 个章节
                          {result.action_items.length > 0 ? ` · ${result.action_items.length} 个行动项` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="accordion-chevron">⌄</div>
                  </button>

                  {open ? (
                    <div className="accordion-content">
                      {result.sections.map((section) => (
                        <div key={`${result.agent_id}-${section.title}`} className="section-block">
                          <div className="section-block-title">{section.title}</div>
                          <div className="section-block-copy">{section.content}</div>
                        </div>
                      ))}

                      {result.action_items.length > 0 ? (
                        <div className="section-block">
                          <div className="section-block-title">行动项</div>
                          <ol className="action-list">
                            {result.action_items.map((item) => (
                              <li key={`${result.agent_id}-${item}`}>{item}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {data.published_assets.length > 0 ? (
          <section className="card">
            <div className="section-heading">
              <div>
                <div className="section-title">已发布到飞书</div>
                <div className="section-copy">以下资源已经同步完成。</div>
              </div>
            </div>
            <div className="asset-list">
              {data.published_assets.map((asset, index) => (
                <FeishuAssetCard key={`${asset.type}-${asset.id ?? index}`} asset={asset} />
              ))}
            </div>
          </section>
        ) : null}

        {data.status === 'done' ? (
          <section className="card">
            <div className="section-heading">
              <div>
                <div className="section-title">发布到飞书</div>
                <div className="section-copy">选择发布渠道，并补充需要的目标信息。</div>
              </div>
            </div>

            <div className="publish-grid">
              {PUBLISH_OPTIONS.map((option) => {
                const selected = publishTypes.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`publish-option${selected ? ' is-selected' : ''}`}
                    onClick={() =>
                      setPublishTypes((current) =>
                        current.includes(option.value)
                          ? current.filter((item) => item !== option.value)
                          : [...current, option.value]
                      )
                    }
                  >
                    <span className="checkbox" aria-hidden="true">
                      ✓
                    </span>
                    <span style={{ textAlign: 'left' }}>
                      <span className="field-label">{option.label}</span>
                      <span className="section-copy" style={{ display: 'block', marginTop: '4px' }}>
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field-label">文档标题</span>
                <input
                  className="input"
                  value={docTitle}
                  onChange={(event) => setDocTitle(event.target.value)}
                  placeholder="例如：4 月经营分析周报"
                />
              </label>

              <label className="field">
                <span className="field-label">群聊 ID</span>
                <input
                  className="input"
                  value={chatId}
                  onChange={(event) => setChatId(event.target.value)}
                  placeholder="可选，留空则使用默认配置"
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={publishing || publishTypes.length === 0}
                onClick={handlePublish}
              >
                {publishing ? (
                  <>
                    <span className="spinner" />
                    发布中...
                  </>
                ) : (
                  '发布到飞书'
                )}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
