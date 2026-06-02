import { create } from 'zustand'
import type { WordBook, Word } from '../../shared/types'
import { wordbooksApi, wordsApi, studyApi, statsApi } from '../api'

type StudyPhase = 'selection' | 'memory' | 'practice' | 'completed'

interface AppState {
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

  // Actions
  fetchWordbooks: () => Promise<void>
  createWordbook: (name: string, description?: string) => Promise<void>
  deleteWordbook: (id: string) => Promise<void>
  selectWordbook: (id: string) => Promise<void>
  addWords: (wordbookId: string, words: Partial<Word>[]) => Promise<void>
  deleteWord: (wordId: string) => Promise<void>
  updateWord: (wordId: string, data: Partial<Word>) => Promise<void>
  setDailyGoal: (count: number) => void
  setHasSetup: (value: boolean) => void
  
  // 新学习流程相关 Actions
  startNewStudySession: () => Promise<void>
  proceedToMemory: () => void
  proceedToPractice: () => void
  markWordKnown: () => void
  markWordUnknown: () => void
  markWordMastered: () => void
  markWordNotMastered: () => void
  toggleMeaning: () => void
  
  // 统计相关
  fetchDailyStats: () => Promise<void>
  updateDailyStats: (data: Partial<any>) => Promise<void>

  // 清除错误
  clearError: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  wordbooks: [],
  currentWordbook: null,
  currentWords: [],
  loading: false,
  error: null,

  dailyGoal: 30,
  studyPhase: 'selection',
  todayWords: [],
  currentWordIndex: 0,
  knownWords: [],
  unknownWords: [],
  masteredWords: [],
  showMeaning: false,

  dailyStats: null,
  hasSetup: false,

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
  },

  setHasSetup: (value: boolean) => {
    set({ hasSetup: value })
  },

  startNewStudySession: async () => {
    const { currentWords, dailyGoal } = get()
    const unstudiedWords = currentWords.filter(w => w.status !== 'mastered')
    const shuffled = [...unstudiedWords].sort(() => Math.random() - 0.5)
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
        wordbookId: get().currentWordbook?.id || '',
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

    try {
      wordsApi.update(word.id, { status: 'known' })
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

    try {
      wordsApi.update(word.id, { status: 'learning' })
    } catch {
      // 静默失败
    }
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
