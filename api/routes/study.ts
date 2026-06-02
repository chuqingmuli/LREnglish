import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { StudySession } from '../../shared/types.js'

const router = express.Router()

// 创建学习会话
router.post('/sessions', (req: Request, res: Response) => {
  try {
    const { wordbookId, type, totalWords } = req.body
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const stmt = db.prepare(
      'INSERT INTO study_sessions (id, wordbook_id, type, total_words, start_time) VALUES (?, ?, ?, ?, ?)'
    )
    stmt.run(id, wordbookId, type, totalWords, now)

    const newSession: StudySession = {
      id,
      wordbookId,
      type: type as any,
      totalWords,
      completedWords: 0,
      correctCount: 0,
      startTime: now,
    }

    res.json({ success: true, data: newSession })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create study session' })
  }
})

// 更新学习会话
router.put('/sessions/:id', (req: Request, res: Response) => {
  try {
    const { completedWords, correctCount, ended } = req.body
    const now = new Date().toISOString()

    let stmt
    if (ended) {
      stmt = db.prepare(
        'UPDATE study_sessions SET completed_words = ?, correct_count = ?, end_time = ? WHERE id = ?'
      )
      stmt.run(completedWords, correctCount, now, req.params.id)
    } else {
      stmt = db.prepare(
        'UPDATE study_sessions SET completed_words = ?, correct_count = ? WHERE id = ?'
      )
      stmt.run(completedWords, correctCount, req.params.id)
    }

    const getStmt = db.prepare('SELECT * FROM study_sessions WHERE id = ?')
    const row = getStmt.get(req.params.id) as any

    if (!row) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    const session: StudySession = {
      id: row.id,
      wordbookId: row.wordbook_id,
      type: row.type,
      totalWords: row.total_words,
      completedWords: row.completed_words,
      correctCount: row.correct_count,
      startTime: row.start_time,
      endTime: row.end_time,
    }

    res.json({ success: true, data: session })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update study session' })
  }
})

export default router
