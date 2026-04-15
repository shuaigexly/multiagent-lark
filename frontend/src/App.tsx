import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Workbench from './pages/Workbench';
import ResultView from './pages/ResultView';
import History from './pages/History';
import Settings from './pages/Settings';

const NAV_ITEMS = [
  { label: '工作台', path: '/', icon: '⚡', description: '创建和执行新任务' },
  { label: '历史任务', path: '/history', icon: '📋', description: '查看已完成与进行中的任务' },
  { label: '设置', path: '/settings', icon: '⚙️', description: '配置 LLM 和飞书凭证' },
];

function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">AI</div>
          <div>
            <div className="sidebar-brand-title">飞书 AI 工作台</div>
            <div className="sidebar-brand-subtitle">Your AI Company</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const active = item.path === '/'
              ? pathname === '/' || pathname.startsWith('/results/')
              : pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="sidebar-nav-copy">
                  <span className="sidebar-nav-label">{item.label}</span>
                  <span className="sidebar-nav-description">{item.description}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">JY</div>
          <div>
            <div className="sidebar-user-name">Workspace Owner</div>
            <div className="sidebar-user-meta">Feishu connected</div>
          </div>
        </div>
        <div className="badge badge-neutral" style={{ justifyContent: 'center', color: 'var(--sidebar-text)' }}>
          v1.0.0
        </div>
      </div>
    </aside>
  );
}

function AppFrame() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="main-scroll">
          <Routes>
            <Route path="/" element={<Workbench />} />
            <Route path="/results/:taskId" element={<ResultView />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppFrame />
    </BrowserRouter>
  );
}
