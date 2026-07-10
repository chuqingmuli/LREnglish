import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { DailyStats } from '../../shared/types.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// 所有 stats 路由都需要认证
router.use(authMiddleware)

// 获取每日统计
router.get('/daily', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { date } = req.query
    const today = date as string || new Date().toISOString().split('T')[0]

    let stmt = db.prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date = ?')
    let row = stmt.get(userId, today) as any

    if (!row) {
      // 如果不存在，创建新的
      const id = crypto.randomUUID()
      const insertStmt = db.prepare(
        'INSERT INTO daily_stats (id, user_id, date, words_learned, words_forget, study_time, accuracy, completed) VALUES (?, ?, ?, 0, 0, 0, 0, 0)'
      )
      insertStmt.run(id, userId, today)

      row = { id, user_id: userId, date: today, words_learned: 0, words_forget: 0, study_time: 0, accuracy: 0, completed: 0 }
    }

    const stats: DailyStats = {
      id: row.id,
      date: row.date,
      wordsLearned: row.words_learned,
      studyTime: row.study_time,
      accuracy: row.accuracy,
      completed: Boolean(row.completed),
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

// 更新每日统计
router.post('/daily', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { date, wordsLearned, studyTime, accuracy, completed } = req.body
    const targetDate = date || new Date().toISOString().split('T')[0]

    // 先检查是否存在
    let stmt = db.prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date = ?')
    let row = stmt.get(userId, targetDate) as any

    if (!row) {
      // 创建新记录
      const id = crypto.randomUUID()
      stmt = db.prepare(
        'INSERT INTO daily_stats (id, user_id, date, words_learned, words_forget, study_time, accuracy, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      stmt.run(id, userId, targetDate, wordsLearned || 0, 0, studyTime || 0, accuracy || 0, completed ? 1 : 0)
    } else {
      // 更新现有记录
      stmt = db.prepare(
        `UPDATE daily_stats 
         SET words_learned = COALESCE(?, words_learned),
             words_forget = COALESCE(?, words_forget),
             study_time = COALESCE(?, study_time),
             accuracy = COALESCE(?, accuracy),
             completed = COALESCE(?, completed)
         WHERE user_id = ? AND date = ?`
      )
      stmt.run(
        wordsLearned !== undefined ? wordsLearned : null,
        null,
        studyTime !== undefined ? studyTime : null,
        accuracy !== undefined ? accuracy : null,
        completed !== undefined ? (completed ? 1 : 0) : null,
        userId,
        targetDate
      )
    }

    // 获取更新后的数据
    stmt = db.prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date = ?')
    row = stmt.get(userId, targetDate) as any

    const stats: DailyStats = {
      id: row.id,
      date: row.date,
      wordsLearned: row.words_learned,
      studyTime: row.study_time,
      accuracy: row.accuracy,
      completed: Boolean(row.completed),
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update stats' })
  }
})

// 获取统计概览（含历史数据）
router.get('/overview', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    // 获取词书总数（系统词书+用户词书，当前系统词书全局共享）
    const wordbookCount = (db.prepare('SELECT COUNT(*) as count FROM wordbooks').get() as any).count

    // 获取单词总数
    const wordCount = (db.prepare('SELECT COUNT(*) as count FROM words').get() as any).count

    // 获取用户已掌握的单词数
    const masteredCount = (db.prepare('SELECT COUNT(*) as count FROM user_word_progress WHERE user_id = ? AND status = ?').get(userId, 'mastered') as any).count

    // 获取过去30天（含今天）用户的统计数据
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]
    const endDate = new Date().toISOString().split('T')[0]

    const recentStatsStmt = db.prepare('SELECT * FROM daily_stats WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date')
    const recentStatsRows = recentStatsStmt.all(userId, startDate, endDate) as any[]

    // 生成完整的30天数据（含今天，填补空缺日期，计算遗忘）
    const history: any[] = []
    let cumulativeLearned = 0
    let lastLearnDate = ''
    let consecutiveNoStudyDays = 0

    // 遗忘率表（按连续未学习天数）
    const forgetRates = [0, 0.15, 0.25, 0.35, 0.45, 0.5] // 第0-5天的遗忘率

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // 找到当天的记录
      const dayRecord = recentStatsRows.find(r => r.date === dateStr)

      if (dayRecord && dayRecord.words_learned > 0) {
        // 今天学了
        cumulativeLearned += dayRecord.words_learned
        history.push({
          date: dateStr,
          wordsLearned: dayRecord.words_learned,
          wordsForget: 0,
          type: 'learn', // 涨
        })
        lastLearnDate = dateStr
        consecutiveNoStudyDays = 0
      } else {
        // 今天没学，计算遗忘
        consecutiveNoStudyDays++
        const forgetRate = forgetRates[Math.min(consecutiveNoStudyDays, 5)]
        const forgetCount = Math.round(cumulativeLearned * forgetRate)

        if (cumulativeLearned > 0 && forgetCount > 0) {
          cumulativeLearned = Math.max(0, cumulativeLearned - forgetCount)
          history.push({
            date: dateStr,
            wordsLearned: 0,
            wordsForget: forgetCount,
            type: 'forget', // 跌
          })
        } else {
          history.push({
            date: dateStr,
            wordsLearned: 0,
            wordsForget: 0,
            type: 'none',
          })
        }
      }
    }

    res.json({
      success: true,
      data: {
        wordbookCount,
        wordCount,
        masteredCount,
        cumulativeLearned,
        history,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch overview' })
  }
})

export default router
