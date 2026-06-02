import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { DailyStats } from '../../shared/types.js'

const router = express.Router()

// 获取每日统计
router.get('/daily', (req: Request, res: Response) => {
  try {
    const { date } = req.query
    const today = date as string || new Date().toISOString().split('T')[0]

    let stmt = db.prepare('SELECT * FROM daily_stats WHERE date = ?')
    let row = stmt.get(today) as any

    if (!row) {
      // 如果不存在，创建新的
      const id = crypto.randomUUID()
      const insertStmt = db.prepare(
        'INSERT INTO daily_stats (id, date, words_learned, study_time, accuracy, completed) VALUES (?, ?, 0, 0, 0, 0)'
      )
      insertStmt.run(id, today)

      row = { id, date: today, words_learned: 0, study_time: 0, accuracy: 0, completed: 0 }
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
    const { date, wordsLearned, studyTime, accuracy, completed } = req.body
    const targetDate = date || new Date().toISOString().split('T')[0]

    // 先检查是否存在
    let stmt = db.prepare('SELECT * FROM daily_stats WHERE date = ?')
    let row = stmt.get(targetDate) as any

    if (!row) {
      // 创建新记录
      const id = crypto.randomUUID()
      stmt = db.prepare(
        'INSERT INTO daily_stats (id, date, words_learned, study_time, accuracy, completed) VALUES (?, ?, ?, ?, ?, ?)'
      )
      stmt.run(id, targetDate, wordsLearned || 0, studyTime || 0, accuracy || 0, completed ? 1 : 0)
    } else {
      // 更新现有记录
      stmt = db.prepare(
        `UPDATE daily_stats 
         SET words_learned = COALESCE(?, words_learned),
             study_time = COALESCE(?, study_time),
             accuracy = COALESCE(?, accuracy),
             completed = COALESCE(?, completed)
         WHERE date = ?`
      )
      stmt.run(
        wordsLearned !== undefined ? wordsLearned : null,
        studyTime !== undefined ? studyTime : null,
        accuracy !== undefined ? accuracy : null,
        completed !== undefined ? (completed ? 1 : 0) : null,
        targetDate
      )
    }

    // 获取更新后的数据
    stmt = db.prepare('SELECT * FROM daily_stats WHERE date = ?')
    row = stmt.get(targetDate) as any

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

// 获取统计概览
router.get('/overview', (req: Request, res: Response) => {
  try {
    // 获取总词书数
    const wordbookCount = (db.prepare('SELECT COUNT(*) as count FROM wordbooks').get() as any).count

    // 获取总单词数
    const wordCount = (db.prepare('SELECT COUNT(*) as count FROM words').get() as any).count

    // 获取已掌握的单词数
    const masteredCount = (db.prepare('SELECT COUNT(*) as count FROM words WHERE status = ?').get('mastered') as any).count

    // 获取最近7天的统计
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentStatsStmt = db.prepare('SELECT * FROM daily_stats WHERE date >= ? ORDER BY date')
    const recentStats = recentStatsStmt.all(sevenDaysAgo.toISOString().split('T')[0])

    res.json({
      success: true,
      data: {
        wordbookCount,
        wordCount,
        masteredCount,
        recentStats: recentStats.map((s: any) => ({
          date: s.date,
          wordsLearned: s.words_learned,
          studyTime: s.study_time,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch overview' })
  }
})

export default router
