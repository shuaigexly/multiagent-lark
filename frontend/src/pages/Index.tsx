import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Upload, FileText, X, Loader2, ArrowRight, Info } from 'lucide-react';
import ModuleCard from '../components/ModuleCard';
import ExecutionTimeline from '../components/ExecutionTimeline';
import { confirmTask, createSSEConnection, getTaskStatus, listAgents, submitTask } from '../services/api';
import type { AgentInfo, SSEEvent, TaskPlanResponse } from '../services/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ALL_AGENT_MODULES = [
  'data_analyst', 'finance_advisor', 'seo_advisor', 'content_manager',
  'product_manager', 'operations_manager', 'ceo_assistant',
];
const PRESET_COMBOS = [
  { label: '经营分析组', modules: ['data_analyst', 'finance_advisor', 'ceo_assistant'] },
  { label: '增长突破组', modules: ['seo_advisor', 'content_manager', 'operations_manager'] },
  { label: '立项评估组', modules: ['product_manager', 'finance_advisor', 'ceo_assistant'] },
  { label: '全明星阵容', modules: ALL_AGENT_MODULES },
];
type Step = 'input' | 'planning' | 'confirm' | 'running' | 'done';

function isSameSelection(a: string[], b: string[]) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
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

  useEffect(() => { listAgents().then(setAgents).catch(() => setError('加载团队成员失败')); }, []);
  useEffect(() => () => { eventSourceRef.current?.close(); }, []);

  const toggleModule = (id: string) =>
    setSelectedModules(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const startSSE = (tid: string, recover: 'input' | 'confirm') => {
    eventSourceRef.current?.close();
    const es = createSSEConnection(tid);
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      const d = JSON.parse(e.data) as SSEEvent;
      if (d.event_type === 'stream.end') { es.close(); if (eventSourceRef.current === es) eventSourceRef.current = null; setStep('done'); setLoading(false); return; }
      if (d.event_type !== 'stream.timeout') setEvents(p => [...p, d]);
    };
    es.onerror = async () => {
      es.close(); if (eventSourceRef.current === es) eventSourceRef.current = null;
      try {
        const s = await getTaskStatus(tid);
        if (s.status === 'done') setStep('done');
        else if (s.status === 'failed') { setStep(recover); setError(recover === 'confirm' ? '任务执行失败，请重新确认' : '任务执行失败'); }
        else setError('连接中断，请刷新页面');
      } catch { setStep(recover); setError('连接中断'); }
      finally { setLoading(false); }
    };
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !file) { setError('请输入任务描述'); return; }
    setError(null); setEvents([]);
    if (selectedModules.length > 0) {
      setPlan(null); setLoading(true); setStep('running');
      try { const r = await submitTask(inputText, file ?? undefined); setTaskId(r.task_id); await confirmTask(r.task_id, selectedModules); startSSE(r.task_id, 'input'); }
      catch { setStep('input'); setError('执行失败'); setLoading(false); }
      return;
    }
    setLoading(true); setStep('planning');
    try { const r = await submitTask(inputText, file ?? undefined); setPlan(r); setTaskId(r.task_id); setSelectedModules(r.selected_modules); setStep('confirm'); }
    catch { setStep('input'); setError('AI 组队失败'); }
    finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    if (!taskId || selectedModules.length === 0) { setError('请至少选择一名团队成员'); return; }
    setError(null); setLoading(true); setEvents([]); setStep('running');
    try { await confirmTask(taskId, selectedModules); startSSE(taskId, 'confirm'); }
    catch { setLoading(false); setStep('confirm'); setError('执行失败'); }
  };

  const formLocked = step !== 'input';
  const selectionLocked = step === 'planning' || step === 'running' || step === 'done';
  const progressValue = step === 'done' ? 100 : step === 'running' ? Math.min(68 + events.length * 6, 94) : 35;

  const stepStates = (() => {
    if (step === 'done') return [2, 2, 2];
    if (step === 'running') return [2, 2, 1];
    if (step === 'planning' || step === 'confirm') return [2, 1, 0];
    return [1, 0, 0]; // 0=idle, 1=active, 2=done
  })();

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
      {/* Title row */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">构建属于你的 AI 团队</h1>
        <p className="text-sm text-muted-foreground mt-1">选好你的团队，告诉他们任务目标，AI 帮你执行并输出到飞书。</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0">
        {['发布任务', '选择团队', '执行中'].map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                ${stepStates[i] === 2 ? 'bg-primary text-primary-foreground' :
                  stepStates[i] === 1 ? 'border-2 border-primary text-primary' :
                  'border border-border text-muted-foreground'}`}>
                {stepStates[i] === 2 ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-xs ${stepStates[i] > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px mx-3 ${stepStates[i + 1] >= 1 ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Input Section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 space-y-4">
          {/* Textarea */}
          <textarea
            className="w-full min-h-[100px] resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 transition-colors"
            placeholder="例如：分析本月经营数据，识别收入波动、成本压力，并给出下周管理动作建议。"
            value={inputText}
            disabled={formLocked}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading && step !== 'running' && step !== 'done') handleSubmit();
            }}
          />

          {/* File upload */}
          <div
            className={`flex items-center gap-3 rounded-md border border-dashed px-3 py-2.5 transition-colors
              ${formLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/50'}
              ${file ? 'border-primary/40 bg-accent/50' : 'border-border'}`}
            onClick={() => !formLocked && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!formLocked && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
          >
            {file ? <FileText className="h-4 w-4 text-primary shrink-0" /> : <Upload className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">{file ? file.name : '点击或拖拽上传附件'}</div>
              <div className="text-[11px] text-muted-foreground">{file ? '附件已就绪' : '支持 CSV、TXT、Markdown'}</div>
            </div>
            {file && !formLocked && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Team selection */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">选择你的团队成员</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">不指定成员时由 AI 自动组队</p>
            </div>
            <span className="rounded bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">可选</span>
          </div>

          {/* AI plan */}
          {step === 'confirm' && plan && (
            <div className="flex items-start gap-2 rounded-md bg-accent px-3 py-2.5">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">AI 已推荐团队 · <span className="text-primary">{plan.task_type_label}</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.reasoning}</p>
              </div>
            </div>
          )}

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COMBOS.map((c) => (
              <button key={c.label} type="button" disabled={selectionLocked}
                onClick={() => setSelectedModules(c.modules)}
                className={`rounded-md px-3 py-1 text-xs transition-colors
                  ${isSameSelection(selectedModules, c.modules) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}
                  disabled:opacity-50`}
              >{c.label}</button>
            ))}
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {agents.map((a) => (
              <ModuleCard key={a.id} agent={a} selected={selectedModules.includes(a.id)} onToggle={toggleModule} disabled={selectionLocked} />
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-secondary/30">
          <div className="text-xs text-muted-foreground">
            {selectedModules.length > 0 ? `已选择 ${selectedModules.length} 名成员` : '未指定成员，AI 将自动组队'}
          </div>
          <Button
            onClick={step === 'confirm' ? handleConfirm : handleSubmit}
            disabled={loading || step === 'running' || step === 'done' || (step === 'confirm' && selectedModules.length === 0)}
          >
            {loading && step === 'planning' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> AI 组队中</> :
             loading && step === 'running' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 执行中</> :
             <>下达指令 <ArrowRight className="h-3.5 w-3.5" /></>}
          </Button>
        </div>
      </div>

      {/* Execution */}
      {(step === 'running' || step === 'done') && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">{step === 'done' ? '执行完成' : '执行中'}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {step === 'done' ? '所有模块已返回结果' : '正在执行，实时同步日志'}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
          <ExecutionTimeline events={events} status={step === 'done' ? 'done' : 'running'} />

          {step === 'done' && taskId && (
            <div className="flex items-center justify-between rounded-md bg-accent px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">任务已完成</div>
                <p className="text-xs text-muted-foreground">可以查看完整报告并发布到飞书</p>
              </div>
              <Button onClick={() => navigate(`/results/${taskId}`)}>
                查看报告 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
