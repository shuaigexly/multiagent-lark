import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

export interface ConfigStatus {
  set: boolean;
  value: string | null;
}

export type ConfigMap = Record<string, ConfigStatus>;

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface ConfigSaveItem {
  key: string;
  value: string | null;
}

export async function getConfig(): Promise<ConfigMap> {
  const response = await api.get('/api/v1/config');
  return response.data;
}

export async function saveConfig(key: string, value: string): Promise<void> {
  await api.post('/api/v1/config', { key, value });
}

export async function saveConfigs(configs: ConfigSaveItem[]): Promise<void> {
  await api.post('/api/v1/config', { configs });
}

export async function testLLM(
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<ConnectionTestResult> {
  const response = await api.post('/api/v1/config/test-llm', {
    api_key: apiKey,
    base_url: baseUrl,
    model,
  });
  return response.data;
}

export async function testFeishu(
  appId: string,
  appSecret: string,
  region: string
): Promise<ConnectionTestResult> {
  const response = await api.post('/api/v1/config/test-feishu', {
    app_id: appId,
    app_secret: appSecret,
    region,
  });
  return response.data;
}
