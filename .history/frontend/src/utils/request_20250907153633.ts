/**
 * 接口请求工具函数
 * - 统一请求头、鉴权 token 注入
 * - 统一错误处理与日志输出
 * 对应文档：技术落地 与 代码规范 3-1
 */

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean
  baseUrl?: string
  body?: any
}

const DEFAULT_BASE_URL =
  (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_BASE) ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:8000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${options.baseUrl || DEFAULT_BASE_URL}${path}`
  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  }

  // 注入 token（当 auth=true 时）
  if (options.auth) {
    const token = getToken()
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  // JSON 自动化
  const isJsonBody = options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)
  if (isJsonBody) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    body: isJsonBody ? JSON.stringify(options.body) : options.body as BodyInit,
  })

  // 统一错误处理
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    const message = text || `${resp.status} ${resp.statusText}`
    console.error('API 请求失败:', { url, status: resp.status, message })
    throw new Error(message)
  }

  // 兼容后端 ResponseHandler { code, data, message }
  const json = (await resp.json().catch(() => ({}))) as any
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T
}
