import { useEffect, useState } from 'react';
import {
  getConfig,
  saveConfigs,
  testFeishu,
  testLLM,
  type ConfigMap,
  type ConnectionTestResult,
} from '../services/config';

type SaveSection = 'llm' | 'feishu' | null;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data;
    if (typeof data === 'string' && data) {
      return data;
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof data.detail === 'string' &&
      data.detail
    ) {
      return data.detail;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export default function Settings() {
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SaveSection>(null);
  const [testingLLM, setTestingLLM] = useState(false);
  const [testingFeishu, setTestingFeishu] = useState(false);

  const [llmProvider, setLlmProvider] = useState('openai_compatible');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('https://api.openai.com/v1');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');

  const [feishuRegion, setFeishuRegion] = useState('cn');
  const [feishuAppId, setFeishuAppId] = useState('');
  const [feishuAppSecret, setFeishuAppSecret] = useState('');

  const [llmTestResult, setLlmTestResult] = useState<ConnectionTestResult | null>(null);
  const [feishuTestResult, setFeishuTestResult] = useState<ConnectionTestResult | null>(null);

  const loadConfig = async () => {
    const data = await getConfig();
    setConfig(data);
    setLlmProvider(data.llm_provider?.value || 'openai_compatible');
    setLlmBaseUrl(data.llm_base_url?.value || 'https://api.openai.com/v1');
    setLlmModel(data.llm_model?.value || 'gpt-4o-mini');
    setFeishuRegion(data.feishu_region?.value || 'cn');
    setFeishuAppId(data.feishu_app_id?.value || '');
  };

  useEffect(() => {
    loadConfig()
      .catch((loadError) => setError(getErrorMessage(loadError, '加载配置失败')))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveLLM = async () => {
    setSaving('llm');
    setError(null);
    setLlmTestResult(null);

    try {
      const configs = [
        { key: 'llm_provider', value: llmProvider.trim() },
        { key: 'llm_base_url', value: llmBaseUrl.trim() },
        { key: 'llm_model', value: llmModel.trim() },
      ];
      if (llmApiKey.trim()) {
        configs.unshift({ key: 'llm_api_key', value: llmApiKey.trim() });
      }
      await saveConfigs(configs);
      setLlmApiKey('');
      await loadConfig();
      setLlmTestResult({ ok: true, message: '配置已保存' });
    } catch (saveError) {
      setError(getErrorMessage(saveError, '保存 LLM 配置失败'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveFeishu = async () => {
    setSaving('feishu');
    setError(null);
    setFeishuTestResult(null);

    try {
      const configs = [
        { key: 'feishu_region', value: feishuRegion.trim() },
        { key: 'feishu_app_id', value: feishuAppId.trim() || null },
      ];
      if (feishuAppSecret.trim()) {
        configs.push({ key: 'feishu_app_secret', value: feishuAppSecret.trim() });
      }
      await saveConfigs(configs);
      setFeishuAppSecret('');
      await loadConfig();
      setFeishuTestResult({ ok: true, message: '配置已保存' });
    } catch (saveError) {
      setError(getErrorMessage(saveError, '保存飞书配置失败'));
    } finally {
      setSaving(null);
    }
  };

  const handleTestLLM = async () => {
    setTestingLLM(true);
    setError(null);
    setLlmTestResult(null);

    try {
      const result = await testLLM(llmApiKey.trim(), llmBaseUrl.trim(), llmModel.trim());
      setLlmTestResult(result);
    } catch (testError) {
      setLlmTestResult({ ok: false, message: getErrorMessage(testError, 'LLM 测试失败') });
    } finally {
      setTestingLLM(false);
    }
  };

  const handleTestFeishu = async () => {
    setTestingFeishu(true);
    setError(null);
    setFeishuTestResult(null);

    try {
      const result = await testFeishu(feishuAppId.trim(), feishuAppSecret.trim(), feishuRegion);
      setFeishuTestResult(result);
    } catch (testError) {
      setFeishuTestResult({ ok: false, message: getErrorMessage(testError, '飞书测试失败') });
    } finally {
      setTestingFeishu(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-state">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="spinner" />
            <span>正在加载配置...</span>
          </div>
        </div>
      </div>
    );
  }

  const llmConfigured = Boolean(config?.llm_api_key?.set);
  const feishuConfigured = Boolean(config?.feishu_app_id?.set && config?.feishu_app_secret?.set);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <div className="page-title">设置</div>
          <div className="page-subtitle">通过界面管理 LLM 与飞书凭证，保存后立即作用于当前运行进程。</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <span className={llmConfigured ? 'status-badge-ok' : 'status-badge-warn'}>
            {llmConfigured ? 'LLM 已配置 ✓' : 'LLM 未配置'}
          </span>
          <span className={feishuConfigured ? 'status-badge-ok' : 'status-badge-warn'}>
            {feishuConfigured ? '飞书已配置 ✓' : '飞书未配置'}
          </span>
        </div>
      </header>

      {error ? <div className="error-banner" style={{ marginBottom: '20px' }}>{error}</div> : null}

      <div className="settings-grid">
        <section className="card">
          <div className="panel-stack">
            <div className="section-heading" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">LLM 配置</div>
                <div className="section-copy">支持 OpenAI 兼容接口，也可以切换到飞书 Aily 模式。</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="llm-provider">Provider</label>
              <select
                id="llm-provider"
                className="input"
                value={llmProvider}
                onChange={(event) => setLlmProvider(event.target.value)}
              >
                <option value="openai_compatible">openai_compatible</option>
                <option value="feishu_aily">feishu_aily</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="llm-api-key">API Key</label>
              <input
                id="llm-api-key"
                className="input"
                type="password"
                value={llmApiKey}
                placeholder={config?.llm_api_key?.value || '输入 API Key'}
                onChange={(event) => setLlmApiKey(event.target.value)}
              />
              <div className="form-helper">已保存的密钥会被掩码显示；留空则保持不变。</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="llm-base-url">Base URL</label>
              <input
                id="llm-base-url"
                className="input"
                type="text"
                value={llmBaseUrl}
                onChange={(event) => setLlmBaseUrl(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="llm-model">Model</label>
              <input
                id="llm-model"
                className="input"
                type="text"
                value={llmModel}
                onChange={(event) => setLlmModel(event.target.value)}
              />
              <div className="form-helper">e.g. gpt-4o-mini, deepseek-chat, moonshot-v1-8k</div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={handleTestLLM} disabled={testingLLM}>
                {testingLLM ? '测试中...' : '测试连接'}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveLLM} disabled={saving === 'llm'}>
                {saving === 'llm' ? '保存中...' : '保存'}
              </button>
              {llmTestResult ? (
                <span className={llmTestResult.ok ? 'test-result-ok' : 'test-result-fail'}>
                  {llmTestResult.ok ? '✓' : '✗'} {llmTestResult.message}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="panel-stack">
            <div className="section-heading" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">飞书配置</div>
                <div className="section-copy">配置应用凭证后，发布和飞书资产相关能力会立即使用新凭证。</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="feishu-region">Region</label>
              <select
                id="feishu-region"
                className="input"
                value={feishuRegion}
                onChange={(event) => setFeishuRegion(event.target.value)}
              >
                <option value="cn">cn (飞书中国版)</option>
                <option value="intl">intl (Lark 国际版)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="feishu-app-id">App ID</label>
              <input
                id="feishu-app-id"
                className="input"
                type="text"
                value={feishuAppId}
                placeholder="cli_xxx"
                onChange={(event) => setFeishuAppId(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="feishu-app-secret">App Secret</label>
              <input
                id="feishu-app-secret"
                className="input"
                type="password"
                value={feishuAppSecret}
                placeholder={config?.feishu_app_secret?.value || '输入 App Secret'}
                onChange={(event) => setFeishuAppSecret(event.target.value)}
              />
              <div className="form-helper">已保存的密钥会被掩码显示；留空则保持不变。</div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={handleTestFeishu} disabled={testingFeishu}>
                {testingFeishu ? '测试中...' : '测试连接'}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveFeishu} disabled={saving === 'feishu'}>
                {saving === 'feishu' ? '保存中...' : '保存'}
              </button>
              {feishuTestResult ? (
                <span className={feishuTestResult.ok ? 'test-result-ok' : 'test-result-fail'}>
                  {feishuTestResult.ok ? '✓' : '✗'} {feishuTestResult.message}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
