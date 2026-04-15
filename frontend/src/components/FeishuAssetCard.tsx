import type { PublishedAsset } from '../services/types';

interface Props {
  asset: PublishedAsset;
}

const ASSET_META: Record<string, { label: string; className: string; icon: string }> = {
  doc: { label: '文档', className: 'badge-info', icon: '📄' },
  bitable: { label: '多维表格', className: 'badge-success', icon: '📊' },
  message: { label: '消息', className: 'badge-warning', icon: '💬' },
  task: { label: '任务', className: 'badge-accent', icon: '☑️' },
  wiki: { label: '知识库', className: 'badge-neutral', icon: '📚' },
};

export default function FeishuAssetCard({ asset }: Props) {
  const meta = ASSET_META[asset.type] ?? { label: asset.type, className: 'badge-neutral', icon: '📎' };

  return (
    <div className="asset-card">
      <div className="asset-icon" aria-hidden="true">
        {meta.icon}
      </div>
      <div className="asset-copy">
        <span className={`badge ${meta.className}`}>{meta.label}</span>
        <div className="asset-title">{asset.title || asset.type}</div>
      </div>
      {asset.url ? (
        <a href={asset.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
          打开 ↗
        </a>
      ) : null}
    </div>
  );
}
