import { create } from 'zustand'
import type { WordBook, Word, User } from '../../shared/types'
import { wordbooksApi, wordsApi, studyApi, statsApi, authApi } from '../api'

type StudyPhase = 'selection' | 'memory' | 'practice' | 'completed'

interface AppState {
  // 用户
  user: User | null
  isAuthenticated: boolean

  // 词书
  wordbooks: WordBook[]
  currentWordbook: WordBook | null
  currentWords: Word[]
  loading: boolean
  error: string | null

  // 学习状态
  dailyGoal: number
  studyPhase: StudyPhase
  todayWords: Word[]
  currentWordIndex: number
  knownWords: Word[]
  unknownWords: Word[]
  masteredWords: Word[]
  showMeaning: boolean

  // 统计
  dailyStats: any | null

  // 设置
  hasSetup: boolean

  // 用户认证 Actions
  login: (username: string, password: string, email?: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>

  // 词书 Actions
  fetchWordbooks: () => Promise<void>
  createWordbook: (name: string, description?: string) => Promise<void>
  deleteWordbook: (id: string) => Promise<void>
  selectWordbook: (id: string) => Promise<void>
  addWords: (wordbookId: string, words: Partial<Word>[]) => Promise<void>
  deleteWord: (wordId: string) => Promise<void>
  updateWord: (wordId: string, data: Partial<Word>) => Promise<void>
  setDailyGoal: (count: number) => void
  setHasSetup: (value: boolean) => void

  // 学习流程 Actions
  startNewStudySession: (wordbookId?: string) => Promise<void>
  proceedToMemory: () => void
  proceedToPractice: () => void
  markWordKnown: () => void
  markWordUnknown: () => void
  markWordMastered: () => void
  markWordNotMastered: () => void
  toggleMeaning: () => void

  // 统计 Actions
  fetchDailyStats: () => Promise<void>
  updateDailyStats: (data: Partial<any>) => Promise<void>

  // 清除错误
  clearError: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  wordbooks: [],
  currentWordbook: null,
  currentWords: [],
  loading: false,
  error: null,

  dailyGoal: parseInt(localStorage.getItem('daily_goal') || '20', 10),
  studyPhase: 'selection',
  todayWords: [],
  currentWordIndex: 0,
  knownWords: [],
  unknownWords: [],
  masteredWords: [],
  showMeaning: false,

  dailyStats: null,
  hasSetup: false,

  // 用户认证
  login: async (username: string, password: string, email?: string): Promise<boolean> => {
    set({ loading: true, error: null })
    try {
      const res = email
        ? await authApi.register({ username, email, password })
        : await authApi.login({ username, password })

      if (res.success && res.data) {
        // 保存token到localStorage
        localStorage.setItem('auth_token', res.data.token)
        set({
          user: res.data.user,
          isAuthenticated: true,
          loading: false,
        })
        return true
      } else {
        set({ error: res.error || '登录失败', loading: false })
        return false
      }
    } catch (err) {
      set({ error: '登录失败', loading: false })
      return false
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
      localStorage.removeItem('auth_token')
      set({
        user: null,
        isAuthenticated: false,
        wordbooks: [],
        currentWordbook: null,
        currentWords: [],
      })
    } catch {
      // 静默失败
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    try {
      const res = await authApi.me()
      if (res.success && res.data) {
        set({ user: res.data, isAuthenticated: true })
      } else {
        localStorage.removeItem('auth_token')
        set({ isAuthenticated: false, user: null })
      }
    } catch {
      localStorage.removeItem('auth_token')
      set({ isAuthenticated: false, user: null })
    }
  },

  fetchWordbooks: async () => {
    set({ loading: true, error: null })
    try {
      const res = await wordbooksApi.getAll()
      if (res.success) {
        set({ wordbooks: res.data || [] })
      } else {
        set({ error: res.error || 'Failed to fetch wordbooks' })
      }
    } catch {
      set({ error: 'Failed to fetch wordbooks' })
    } finally {
      set({ loading: false })
    }
  },

  createWordbook: async (name: string, description?: string) => {
    set({ loading: true, error: null })
    try {
      const res = await wordbooksApi.create({ name, description })
      if (res.success && res.data) {
        set(state => ({ wordbooks: [res.data!, ...state.wordbooks] }))
      } else {
        set({ error: res.error || 'Failed to create wordbook' })
      }
    } catch {
      set({ error: 'Failed to create wordbook' })
    } finally {
      set({ loading: false })
    }
  },

  deleteWordbook: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const res = await wordbooksApi.delete(id)
      if (res.success) {
        set(state => ({ wordbooks: state.wordbooks.filter(w => w.id !== id) }))
      } else {
        set({ error: res.error || 'Failed to delete wordbook' })
      }
    } catch {
      set({ error: 'Failed to delete wordbook' })
    } finally {
      set({ loading: false })
    }
  },

  selectWordbook: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const wordbookRes = await wordbooksApi.get(id)
      const wordsRes = await wordbooksApi.getWords(id)
      if (wordbookRes.success && wordsRes.success) {
        set({
          currentWordbook: wordbookRes.data || null,
          currentWords: wordsRes.data || [],
        })
      } else {
        set({ error: wordbookRes.error || wordsRes.error || 'Failed to fetch wordbook' })
      }
    } catch {
      set({ error: 'Failed to fetch wordbook' })
    } finally {
      set({ loading: false })
    }
  },

  addWords: async (wordbookId: string, words: Partial<Word>[]) => {
    set({ loading: true, error: null })
    try {
      const res = await wordbooksApi.addWords(wordbookId, words)
      if (res.success) {
        const wordsRes = await wordbooksApi.getWords(wordbookId)
        if (wordsRes.success) {
          set({ currentWords: wordsRes.data || [] })
        }
      } else {
        set({ error: res.error || 'Failed to add words' })
      }
    } catch {
      set({ error: 'Failed to add words' })
    } finally {
      set({ loading: false })
    }
  },

  deleteWord: async (wordId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await wordsApi.delete(wordId)
      if (res.success) {
        set(state => ({
          currentWords: state.currentWords.filter(w => w.id !== wordId),
        }))
      } else {
        set({ error: res.error || 'Failed to delete word' })
      }
    } catch {
      set({ error: 'Failed to delete word' })
    } finally {
      set({ loading: false })
    }
  },

  updateWord: async (wordId: string, data: Partial<Word>) => {
    try {
      const res = await wordsApi.update(wordId, data)
      if (res.success && res.data) {
        set(state => ({
          currentWords: state.currentWords.map(w =>
            w.id === wordId ? res.data! : w
          ),
        }))
      }
    } catch {
      // 静默失败
    }
  },

  setDailyGoal: (count: number) => {
    set({ dailyGoal: count })
    // 同步到 localStorage 防止刷新丢失
    localStorage.setItem('daily_goal', String(count))
  },

  setHasSetup: (value: boolean) => {
    set({ hasSetup: value })
  },

  startNewStudySession: async (wordbookId?: string) => {
    // 如果提供了 wordbookId，先获取最新数据
    let latestWords: any[] = []

    if (wordbookId) {
      const wordsRes = await wordbooksApi.getWords(wordbookId)
      if (wordsRes.success && wordsRes.data) {
        latestWords = wordsRes.data
        set({ currentWords: latestWords })
      }
    } else {
      latestWords = get().currentWords
    }

    // 从最新的生词本中抽取
    const unstudiedWords = latestWords.filter(w => w.status === 'unknown')
    const shuffled = [...unstudiedWords].sort(() => Math.random() - 0.5)
    const dailyGoal = get().dailyGoal
    const todayWords = shuffled.slice(0, dailyGoal)

    set({
      todayWords,
      currentWordIndex: 0,
      knownWords: [],
      unknownWords: [],
      masteredWords: [],
      studyPhase: 'memory',
      showMeaning: false,
    })

    try {
      await studyApi.createSession({
        wordbookId: get().currentWordbook?.id || wordbookId || '',
        type: 'daily',
        totalWords: todayWords.length,
      })
    } catch {
      // 静默失败
    }
  },

  proceedToMemory: () => {
    set({
      studyPhase: 'memory',
      currentWordIndex: 0,
    })
  },

  proceedToPractice: () => {
    const { todayWords } = get()
    set({
      studyPhase: 'practice',
      currentWordIndex: 0,
      showMeaning: false,
      knownWords: [],
      unknownWords: [],
    })
  },

  markWordKnown: () => {
    const { todayWords, currentWordIndex, knownWords } = get()
    const word = todayWords[currentWordIndex]
    if (!word) return

    const newKnownWords = [...knownWords, word]
    const newIndex = currentWordIndex + 1

    set({
      knownWords: newKnownWords,
      currentWordIndex: newIndex,
      showMeaning: false,
    })

    // 认识的词标记为 'learning'（学习中）
    try {
      wordsApi.update(word.id, { status: 'learning' })
    } catch {
      // 静默失败
    }
  },

  markWordUnknown: () => {
    const { todayWords, currentWordIndex, unknownWords } = get()
    const word = todayWords[currentWordIndex]
    if (!word) return

    const newUnknownWords = [...unknownWords, word]
    const newIndex = currentWordIndex + 1

    set({
      unknownWords: newUnknownWords,
      currentWordIndex: newIndex,
      showMeaning: false,
    })

    // 不认识的词保持 'unknown' 状态（继续留在生词本）
    // 不需要更新数据库，因为已经是 unknown 了
  },

  markWordMastered: () => {
    const { todayWords, currentWordIndex, masteredWords } = get()
    const word = todayWords[currentWordIndex]
    if (!word) return

    const newMasteredWords = [...masteredWords, word]
    const newIndex = currentWordIndex + 1

    set({
      masteredWords: newMasteredWords,
      currentWordIndex: newIndex,
      showMeaning: true,
    })

    try {
      wordsApi.update(word.id, { status: 'mastered' })
    } catch {
      // 静默失败
    }
  },

  markWordNotMastered: () => {
    const { todayWords, currentWordIndex } = get()
    const word = todayWords[currentWordIndex]
    if (!word) return

    // 把不认识的词放回到队列末尾
    const newWords = [...todayWords]
    const removed = newWords.splice(currentWordIndex, 1)
    newWords.push(removed[0])

    set({
      todayWords: newWords,
      showMeaning: true,
    })
  },

  toggleMeaning: () => {
    set(state => ({ showMeaning: !state.showMeaning }))
  },

  fetchDailyStats: async () => {
    try {
      const res = await statsApi.getDaily()
      if (res.success) {
        set({ dailyStats: res.data || null })
      }
    } catch {
      // 静默失败
    }
  },

  updateDailyStats: async (data: Partial<any>) => {
    try {
      const res = await statsApi.updateDaily(data)
      if (res.success) {
        set({ dailyStats: res.data || null })
      }
    } catch {
      // 静默失败
    }
  },

  clearError: () => set({ error: null }),
}))
