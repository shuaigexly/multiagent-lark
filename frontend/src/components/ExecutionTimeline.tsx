import { useEffect, useRef } from 'react';
import type { SSEEvent } from '../services/types';
import { AGENT_PERSONAS } from './ModuleCard';

interface Props {
  events: SSEEvent[];
  status: 'running' | 'done' | 'failed' | 'idle';
}

function getTimestamp(event: SSEEvent, cache: Map<number, string>) {
  const ts = event.payload?.timestamp;
  if (typeof ts === 'string') return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
  const existing = cache.get(event.sequence);
  if (existing) return existing;
  const created = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  cache.set(event.sequence, created);
  return created;
}

function getModuleName(event: SSEEvent) {
  return event.agent_name?.trim() || event.event_type.split('.').pop()?.toUpperCase() || 'SYSTEM';
}

export default function ExecutionTimeline({ events, status }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cacheRef = useRef(new Map<number, string>());

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length, status]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <span className="text-xs font-medium text-foreground">执行日志</span>
        <span className={`text-xs ${status === 'running' ? 'text-primary' : status === 'done' ? 'text-success' : 'text-muted-foreground'}`}>
          {status === 'running' ? '执行中...' : status === 'done' ? '已完成' : '等待中'}
        </span>
      </div>
      <div ref={ref} className="p-3 font-mono text-xs leading-6 max-h-72 overflow-y-auto bg-card space-y-0">
        {events.length === 0 ? (
          <div className="text-muted-foreground">
            [{status === 'running' ? '连接中' : '等待'}] {status === 'running' ? '正在连接执行流...' : '等待执行开始...'}
          </div>
        ) : (
          events.map((event) => {
            const name = getModuleName(event);
            const persona = Object.values(AGENT_PERSONAS).find(p => p.name === name);
            const isError = event.event_type.includes('failed') || event.event_type.includes('error');
            const isDone = event.event_type.includes('completed') || event.event_type.includes('done');
            return (
              <div key={event.sequence} className={isError ? 'text-destructive' : isDone ? 'text-success' : 'text-foreground'}>
                <span className="text-muted-foreground">[{getTimestamp(event, cacheRef.current)}]</span>{' '}
                <span className="font-medium" style={persona ? { color: persona.color } : undefined}>{name}</span>{' '}
                {event.message}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
