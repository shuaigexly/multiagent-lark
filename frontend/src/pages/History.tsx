import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTasks } from '../services/api';
import type { TaskListItem } from '../services/types';

const STATUS_META: Record<string, { label: string; className: string }> = {
  done: { label: '已完成', className: 'badge-success' },
  running: { label: '执行中', className: 'badge-warning' },
  failed: { label: '失败', className: 'badge-error' },
  pending: { label: '等待中', className: 'badge-neutral' },
  planning: { label: '规划中', className: 'badge-info' },
};

function getTaskTypeClass(taskTypeLabel: string | null) {
  const label = taskTypeLabel?.toLowerCase() ?? '';

  if (label.includes('财务') || label.includes('经营')) {
    return 'badge-success';
  }
  if (label.includes('内容') || label.includes('增长')) {
    return 'badge-warning';
  }
  if (label.includes('产品') || label.includes('立项')) {
    return 'badge-info';
  }
  return 'badge-accent';
}

function formatRelativeTime(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  const minutes = Math.round(diff / (1000 * 60));

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, 'day');
}

export default function History() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => setError('加载历史记录失败'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <div className="page-title">历史任务</div>
          <div className="page-subtitle">回看之前提交的任务、执行状态和生成结果。</div>
        </div>
        <span className="badge badge-neutral">{tasks.length} 个任务</span>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="loading-state">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="spinner" />
            <span>正在加载历史任务...</span>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div>
            <div className="empty-state-illustration">🗂️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600 }}>
              暂无历史任务
            </div>
            <div style={{ marginTop: '8px' }}>创建第一个 AI 工作流，结果会在这里持续沉淀。</div>
            <button type="button" className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
              创建任务
            </button>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {tasks.map((task) => {
            const status = STATUS_META[task.status] ?? { label: task.status, className: 'badge-neutral' };
            const canNavigate = task.status !== 'pending' && task.status !== 'planning';

            return (
              <article
                key={task.id}
                className="history-card"
                onClick={() => {
                  if (canNavigate) {
                    navigate(`/results/${task.id}`);
                  }
                }}
                role={canNavigate ? 'button' : undefined}
                tabIndex={canNavigate ? 0 : -1}
                onKeyDown={(event) => {
                  if (canNavigate && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigate(`/results/${task.id}`);
                  }
                }}
              >
                <div className="history-card-main">
                  <div className="history-card-meta">
                    {task.task_type_label ? (
                      <span className={`badge ${getTaskTypeClass(task.task_type_label)}`}>{task.task_type_label}</span>
                    ) : null}
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </div>
                  <div className="history-card-title">{task.input_text || '未提供文本描述，任务基于上传文件创建'}</div>
                </div>

                <div className="history-card-side">
                  <div>{formatRelativeTime(task.created_at)}</div>
                  <div>{canNavigate ? '查看结果 →' : '等待生成中'}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
