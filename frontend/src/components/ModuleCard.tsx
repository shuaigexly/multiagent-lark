import type { CSSProperties } from 'react';
import type { AgentInfo } from '../services/types';

interface Props {
  agent: AgentInfo;
  selected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

const AGENT_PERSONAS: Record<
  string,
  {
    name: string;
    title: string;
    avatar: string;
    color: string;
    soft: string;
    personality: string[];
    tagline: string;
  }
> = {
  data_analyst: {
    name: '陈晓明',
    title: '数据分析师',
    avatar: '陈',
    color: '#2563eb',
    soft: 'rgba(37, 99, 235, 0.15)',
    personality: ['严谨', '数字控', '逻辑清晰'],
    tagline: '用数字说话，把模糊问题变成精确结论',
  },
  finance_advisor: {
    name: '李婷婷',
    title: 'CFO · 财务顾问',
    avatar: '李',
    color: '#059669',
    soft: 'rgba(5, 150, 105, 0.15)',
    personality: ['稳健', '风控意识强', '利润优先'],
    tagline: '守护现金流，每一分钱都要花在刀刃上',
  },
  seo_advisor: {
    name: '王浩然',
    title: '增长黑客',
    avatar: '王',
    color: '#d97706',
    soft: 'rgba(217, 119, 6, 0.15)',
    personality: ['激进', '流量思维', '实验驱动'],
    tagline: '找到你的用户在哪，把他们带到你面前',
  },
  content_manager: {
    name: '林诗雨',
    title: '内容总监',
    avatar: '林',
    color: '#7c3aed',
    soft: 'rgba(124, 58, 237, 0.15)',
    personality: ['创意', '品牌感强', '细节控'],
    tagline: '让每一篇内容都成为品牌的名片',
  },
  product_manager: {
    name: '张志远',
    title: '产品经理',
    avatar: '张',
    color: '#db2777',
    soft: 'rgba(219, 39, 119, 0.15)',
    personality: ['用户导向', '需求挖掘', '路线清晰'],
    tagline: '把用户痛点变成产品机会，让功能讲故事',
  },
  operations_manager: {
    name: '赵小雅',
    title: '运营总监',
    avatar: '赵',
    color: '#0891b2',
    soft: 'rgba(8, 145, 178, 0.15)',
    personality: ['执行力强', '多线并行', '结果导向'],
    tagline: '从计划到落地，确保每个环节都不掉链子',
  },
  ceo_assistant: {
    name: '吴思远',
    title: 'CEO 助理',
    avatar: '吴',
    color: '#374151',
    soft: 'rgba(55, 65, 81, 0.15)',
    personality: ['全局视野', '决策支持', '综合汇总'],
    tagline: '帮你看清全局，把所有结论整合成行动计划',
  },
};

export default function ModuleCard({ agent, selected, onToggle, disabled = false }: Props) {
  const persona = AGENT_PERSONAS[agent.id] ?? {
    name: agent.name,
    title: 'AI 团队成员',
    avatar: agent.name.slice(0, 1),
    color: '#6b7280',
    soft: 'rgba(107, 114, 128, 0.15)',
    personality: agent.suitable_for.slice(0, 3),
    tagline: agent.description,
  };

  const cardStyle = {
    borderColor: selected ? persona.color : 'var(--border)',
    borderWidth: selected ? '2px' : '1.5px',
    background: selected ? `linear-gradient(0deg, ${persona.soft}, ${persona.soft}), #fff` : '#fff',
  } satisfies CSSProperties;

  return (
    <button
      type="button"
      className={`agent-card${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={() => {
        if (!disabled) {
          onToggle(agent.id);
        }
      }}
      aria-pressed={selected}
      aria-label={`${persona.name}，${persona.title}`}
      disabled={disabled}
      style={cardStyle}
    >
      <div className="agent-card-header">
        <div className="agent-avatar" style={{ background: persona.color }}>
          {persona.avatar}
        </div>
        <div className="agent-card-info">
          <div className="agent-name">{persona.name}</div>
          <div className="agent-title">{persona.title}</div>
        </div>
      </div>

      <span className="agent-check" style={{ background: persona.color }} aria-hidden="true">
        ✓
      </span>

      <div className="agent-tagline">{persona.tagline}</div>

      <div className="agent-tags">
        {persona.personality.map((tag) => (
          <span key={tag} className="agent-tag" style={{ background: persona.soft, color: persona.color }}>
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
