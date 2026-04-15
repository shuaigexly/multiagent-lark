import { useEffect, useRef } from 'react';
import type { SSEEvent } from '../services/types';

interface Props {
  events: SSEEvent[];
  status: 'running' | 'done' | 'failed' | 'idle';
}

const EVENT_COLORS: Record<string, string> = {
  'module.completed': 'var(--timeline-success)',
  'task.done': 'var(--timeline-success)',
  'module.failed': 'var(--timeline-error)',
  'task.error': 'var(--timeline-error)',
  'task.recognized': 'var(--timeline-info)',
  'context.retrieved': 'var(--timeline-info)',
  'feishu.writing': 'var(--timeline-info)',
  'module.started': 'var(--timeline-default)',
};

function getTimestamp(event: SSEEvent, cache: Map<number, string>) {
  const payloadTimestamp = event.payload?.timestamp;

  if (typeof payloadTimestamp === 'string') {
    return new Date(payloadTimestamp).toLocaleTimeString('zh-CN', { hour12: false });
  }

  const existing = cache.get(event.sequence);
  if (existing) {
    return existing;
  }

  const created = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  cache.set(event.sequence, created);
  return created;
}

function getModuleName(event: SSEEvent) {
  if (event.agent_name?.trim()) {
    return event.agent_name.toUpperCase().replaceAll(' ', '_');
  }

  return event.event_type.split('.').pop()?.toUpperCase() ?? 'SYSTEM';
}

export default function ExecutionTimeline({ events, status }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const timestampCacheRef = useRef(new Map<number, string>());

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [events.length, status]);

  return (
    <div className="timeline">
      <div className="timeline-head">
        <div className="timeline-title">执行日志</div>
        <div className="timeline-status">
          {status === 'running' ? 'Executing...' : status === 'done' ? 'Completed' : 'Waiting'}
        </div>
      </div>

      <div ref={bodyRef} className="timeline-body">
        {events.length === 0 ? (
          <div className="timeline-line" style={{ color: 'var(--timeline-muted)' }}>
            <span className="timeline-time">[--:--:--]</span>
            <span className="timeline-module">SYSTEM</span>
            <span className="timeline-message">
              {status === 'running' ? '正在连接执行流...' : '等待执行开始...'}
            </span>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.sequence}
              className="timeline-line"
              style={{ color: EVENT_COLORS[event.event_type] ?? 'var(--timeline-default)' }}
            >
              <span className="timeline-time">[{getTimestamp(event, timestampCacheRef.current)}]</span>
              <span className="timeline-module">{getModuleName(event)}</span>
              <span className="timeline-message">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
