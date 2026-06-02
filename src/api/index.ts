import type { WordBook, Word, StudySession, DailyStats, ApiResponse } from '../../shared/types'

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON')
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 词书 API
export const wordbooksApi = {
  getAll: () => request<WordBook[]>('/wordbooks'),
  create: (data: { name: string; description?: string; type?: 'built-in' | 'custom' }) =>
    request<WordBook>('/wordbooks', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request<WordBook>(`/wordbooks/${id}`),
  update: (id: string, data: { name?: string; description?: string }) =>
    request(`/wordbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/wordbooks/${id}`, { method: 'DELETE' }),
  getWords: (id: string) => request<Word[]>(`/wordbooks/${id}/words`),
  addWords: (id: string, words: Partial<Word>[]) =>
    request<Word[]>(`/wordbooks/${id}/words`, { method: 'POST', body: JSON.stringify({ words }) }),
}

// 单词 API
export const wordsApi = {
  update: (id: string, data: Partial<Word>) =>
    request<Word>(`/words/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/words/${id}`, { method: 'DELETE' }),
  batchUpdateStatus: (wordIds: string[], status: string) =>
    request('/words/batch-status', { method: 'POST', body: JSON.stringify({ wordIds, status }) }),
}

// 学习会话 API
export const studyApi = {
  createSession: (data: { wordbookId: string; type: string; totalWords: number }) =>
    request<StudySession>('/study/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id: string, data: { completedWords?: number; correctCount?: number; ended?: boolean }) =>
    request<StudySession>(`/study/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// 统计 API
export const statsApi = {
  getDaily: (date?: string) => request<DailyStats>(`/stats/daily${date ? `?date=${date}` : ''}`),
  updateDaily: (data: Partial<DailyStats>) =>
    request<DailyStats>('/stats/daily', { method: 'POST', body: JSON.stringify(data) }),
  getOverview: () => request('/stats/overview'),
}
