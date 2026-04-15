import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleCard from '../components/ModuleCard';
import ExecutionTimeline from '../components/ExecutionTimeline';
import { confirmTask, createSSEConnection, getTaskStatus, listAgents, submitTask } from '../services/api';
import type { AgentInfo, SSEEvent, TaskPlanResponse } from '../services/types';

const ALL_AGENT_MODULES = [
  'data_analyst',
  'finance_advisor',
  'seo_advisor',
  'content_manager',
  'product_manager',
  'operations_manager',
  'ceo_assistant',
];

const PRESET_COMBOS = [
  { label: '经营分析组', modules: ['data_analyst', 'finance_advisor', 'ceo_assistant'] },
  { label: '增长突破组', modules: ['seo_advisor', 'content_manager', 'operations_manager'] },
  { label: '立项评估组', modules: ['product_manager', 'finance_advisor', 'ceo_assistant'] },
  { label: '全明星阵容', modules: ALL_AGENT_MODULES },
];

type Step = 'input' | 'planning' | 'confirm' | 'running' | 'done';

function isSameSelection(left: string[], right: string[]) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function getProgressState(step: Step) {
  if (step === 'done') {
    return ['complete', 'complete', 'complete'] as const;
  }

  if (step === 'running') {
    return ['complete', 'complete', 'active'] as const;
  }

  if (step === 'planning' || step === 'confirm') {
    return ['complete', 'active', 'idle'] as const;
  }

  return ['active', 'idle', 'idle'] as const;
}

export default function Workbench() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [plan, setPlan] = useState<TaskPlanResponse | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAgents().then(setAgents).catch(() => setError('加载团队成员失败'));
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const startSSE = (currentTaskId: string, recoverStep: 'input' | 'confirm') => {
    eventSourceRef.current?.close();

    const eventSource = createSSEConnection(currentTaskId);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (messageEvent) => {
      const data = JSON.parse(messageEvent.data) as SSEEvent;

      if (data.event_type === 'stream.end') {
        eventSource.close();
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
        setStep('done');
        setLoading(false);
        return;
      }

      if (data.event_type !== 'stream.timeout') {
        setEvents((prev) => [...prev, data]);
      }
    };

    eventSource.onerror = async () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }

      try {
        const statusData = await getTaskStatus(currentTaskId);

        if (statusData.status === 'done') {
          setStep('done');
        } else if (statusData.status === 'failed') {
          setStep(recoverStep);
          setError(recoverStep === 'confirm' ? '任务执行失败，请重新确认执行' : '任务执行失败，请重试');
        } else {
          setError('连接中断，请刷新页面查看进度');
        }
      } catch {
        setStep(recoverStep);
        setError('连接中断，请刷新页面');
      } finally {
        setLoading(false);
      }
    };
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !file) {
      setError('请输入任务描述');
      return;
    }

    setError(null);
    setEvents([]);

    if (selectedModules.length > 0) {
      setPlan(null);
      setLoading(true);
      setStep('running');

      try {
        const result = await submitTask(inputText, file ?? undefined);
        setTaskId(result.task_id);
        await confirmTask(result.task_id, selectedModules);
        startSSE(result.task_id, 'input');
      } catch {
        setStep('input');
        setError('执行失败，请重试');
        setLoading(false);
      }

      return;
    }

    setLoading(true);
    setStep('planning');

    try {
      const result = await submitTask(inputText, file ?? undefined);
      setPlan(result);
      setTaskId(result.task_id);
      setSelectedModules(result.selected_modules);
      setStep('confirm');
    } catch {
      setStep('input');
      setError('AI 组队失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!taskId || selectedModules.length === 0) {
      setError('请至少选择一名团队成员');
      return;
    }

    setError(null);
    setLoading(true);
    setEvents([]);
    setStep('running');

    try {
      await confirmTask(taskId, selectedModules);
      startSSE(taskId, 'confirm');
    } catch {
      setLoading(false);
      setStep('confirm');
      setError('执行失败，请重试');
    }
  };

  const progressStates = getProgressState(step);
  const progressValue = step === 'done' ? 100 : step === 'running' ? Math.min(68 + events.length * 6, 94) : 35;
  const formLocked = step !== 'input';
  const selectionLocked = step === 'planning' || step === 'running' || step === 'done';
  const actionCopy = selectedModules.length > 0 ? `已招募 ${selectedModules.length} 名成员` : '未指定成员，AI 将自动为你组队';
  const submitLabel = '下达指令 →';

  return (
    <div className="page-shell">
      <div className="workbench-shell">
        <div className="hero-stack">
          <div className="workbench-intro">
            <h1 className="workbench-title">构建属于你的 AI 团队</h1>
            <p className="workbench-subtitle" style={{ display: 'none' }}>
              你是 CEO。选好你的团队，告诉他们任务目标，看他们帮你把事情做成。
            </p>
          </div>

          <div className="progress-steps workbench-progress">
            {[
              { title: '发布任务', copy: '告诉团队目标与上下文' },
              { title: '选择团队', copy: '亲自招募，或交给 AI 组队' },
              { title: '执行中', copy: step === 'done' ? '已完成' : '启动并查看进度' },
            ].map((item, index) => {
              const state = progressStates[index];

              return (
                <div
                  key={item.title}
                  className={`progress-step${state === 'complete' ? ' is-complete' : ''}${
                    state === 'active' ? ' is-active' : ''
                  }`}
                >
                  <div className="progress-step-index">{state === 'complete' ? '✓' : index + 1}</div>
                  <div>
                    <div className="progress-step-title">{item.title}</div>
                    <div className="progress-step-copy">{item.copy}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <section className="card workbench-form-card">
            <div className="panel-stack">
              <div className="workbench-input-block">
                <textarea
                  className="input textarea-lg"
                  placeholder="例如：分析本月经营数据，识别收入波动、成本压力，并给出下周管理动作建议。"
                  value={inputText}
                  disabled={formLocked}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading && step !== 'running' && step !== 'done') {
                      handleSubmit();
                    }
                  }}
                />

                <div
                  className={`workbench-upload-row${formLocked ? ' is-disabled' : ''}${file ? ' is-selected' : ''}`}
                  onClick={() => {
                    if (!formLocked) {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (formLocked) {
                      return;
                    }

                    const droppedFile = event.dataTransfer.files[0];
                    if (droppedFile) {
                      setFile(droppedFile);
                    }
                  }}
                >
                  <div className="workbench-upload-trigger">{file ? '更换附件' : '上传附件'}</div>
                  <div className="workbench-upload-copy">
                    <div className="workbench-upload-title">{file ? file.name : '拖拽文件到这里，或点击选择'}</div>
                    <div className="workbench-upload-meta">
                      {file ? '附件已就绪，执行时会一并提交' : '支持 CSV、TXT、Markdown 或补充说明文档'}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                    }
                  }}
                />

                <div className="helper-row">
                  <span>{file ? '已附加 1 个文件' : '也可以只输入文本描述，无需上传附件。'}</span>
                  <span>快捷键 `⌘/Ctrl + Enter`</span>
                </div>
              </div>

              <div className="workbench-module-block">
                <div className="section-heading workbench-module-heading">
                  <div>
                    <div className="section-title">选择你的团队成员</div>
                    <div className="section-copy">亲自招募成员可直接执行；不指定成员则由 AI 自动组队。</div>
                  </div>
                  <span className="badge badge-neutral">可选 · 不指定则自动组队</span>
                </div>

                {step === 'confirm' && plan ? (
                  <div className="info-box">
                    <div className="info-box-label">AI 已为你组建团队</div>
                    <span className="badge badge-info" style={{ marginBottom: '10px' }}>
                      {plan.task_type_label}
                    </span>
                    <div>{plan.reasoning}</div>
                  </div>
                ) : null}

                <div className="preset-row">
                  {PRESET_COMBOS.map((combo) => (
                    <button
                      key={combo.label}
                      type="button"
                      className={`preset-pill${isSameSelection(selectedModules, combo.modules) ? ' is-active' : ''}`}
                      disabled={selectionLocked}
                      onClick={() => setSelectedModules(combo.modules)}
                    >
                      {combo.label}
                    </button>
                  ))}
                </div>

                <div className="agent-grid">
                  {agents.map((agent) => (
                    <ModuleCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedModules.includes(agent.id)}
                      onToggle={toggleModule}
                      disabled={selectionLocked}
                    />
                  ))}
                </div>
              </div>

              <div className="workbench-action-row">
                <div>
                  <div className="workbench-action-title">{actionCopy}</div>
                  <div className="section-copy">
                    {step === 'confirm' && plan
                      ? 'AI 已给出推荐团队，你仍然可以继续调整后再下达指令。'
                      : '指定成员将直接执行；不指定则先由 AI 判断任务并组队。'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg workbench-submit"
                  onClick={step === 'confirm' ? handleConfirm : handleSubmit}
                  disabled={loading || step === 'running' || step === 'done' || (step === 'confirm' && selectedModules.length === 0)}
                >
                  {loading && step === 'planning' ? (
                    <>
                      <span className="spinner" />
                      AI 组队中...
                    </>
                  ) : loading && step === 'running' ? (
                    <>
                      <span className="spinner" />
                      执行中...
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            </div>
          </section>

          {(step === 'running' || step === 'done') && (
            <section className="card workbench-log-section">
              <div className="execution-wrap">
                <div>
                  <div className="section-heading" style={{ marginBottom: '12px' }}>
                    <div>
                      <div className="section-title" style={{ fontSize: '20px' }}>
                        {step === 'done' ? '执行完成' : '执行中'}
                      </div>
                      <div className="section-copy">
                        {step === 'done'
                          ? '所有模块已返回结果，接下来可以查看完整报告。'
                          : '系统正在串联模块执行，并持续同步日志。'}
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progressValue}%` }} />
                  </div>
                </div>

                <ExecutionTimeline events={events} status={step === 'done' ? 'done' : 'running'} />

                {step === 'done' && taskId ? (
                  <div className="card success-card">
                    <div>
                      <div className="section-title" style={{ fontSize: '20px' }}>
                        任务已完成
                      </div>
                      <div className="section-copy">结果摘要、各模块分析和发布选项已经准备好。</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => navigate(`/results/${taskId}`)}
                    >
                      查看报告 →
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
