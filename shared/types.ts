// 用户类型
export interface User {
  id: string
  username: string
  email: string
  createdAt: string
}

// 词书类型
export interface WordBook {
  id: string
  userId: string
  name: string
  description?: string
  type: 'built-in' | 'custom' | 'system'
  wordCount: number
  progress: number
  createdAt: string
  updatedAt: string
}

// 单词类型
export interface Word {
  id: string
  wordbookId: string
  word: string
  phonetic?: string
  partOfSpeech?: string
  meaningCn?: string
  meaningEn?: string
  example?: string
  audioUrl?: string
  status: 'unknown' | 'known' | 'learning' | 'mastered'
  reviewCount: number
  nextReviewAt?: string
  createdAt: string
}

// 学习会话类型
export interface StudySession {
  id: string
  wordbookId: string
  type: 'quick-filter' | 'learning' | 'quiz' | 'review'
  totalWords: number
  completedWords: number
  correctCount: number
  startTime: string
  endTime?: string
}

// 每日统计类型
export interface DailyStats {
  id: string
  date: string
  wordsLearned: number
  studyTime: number
  accuracy: number
  completed: boolean
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
