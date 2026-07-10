import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { Word } from '../../shared/types.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// 所有单词路由都需要认证
router.use(authMiddleware)

// 更新单词（内容+用户学习状态）
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { word, phonetic, partOfSpeech, meaningCn, meaningEn, example, status } = req.body
    const wordId = req.params.id
    const now = new Date().toISOString()

    // 更新单词的基本信息（不包含 status，status 存在 user_word_progress 中）
    const stmt = db.prepare(
      `UPDATE words 
       SET word = COALESCE(?, word), 
           phonetic = COALESCE(?, phonetic), 
           part_of_speech = COALESCE(?, part_of_speech), 
           meaning_cn = COALESCE(?, meaning_cn), 
           meaning_en = COALESCE(?, meaning_en), 
           example = COALESCE(?, example)
       WHERE id = ?`
    )
    const result = stmt.run(word, phonetic, partOfSpeech, meaningCn, meaningEn, example, wordId)

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Word not found' })
    }

    // 如果传了 status，更新用户的学习进度
    if (status) {
      const existingProgress = db.prepare(
        'SELECT id FROM user_word_progress WHERE user_id = ? AND word_id = ?'
      ).get(userId, wordId) as any

      if (existingProgress) {
        db.prepare(
          `UPDATE user_word_progress SET status = ?, review_count = review_count + 1, last_reviewed_at = ?, updated_at = ?
           WHERE user_id = ? AND word_id = ?`
        ).run(status, now, now, userId, wordId)
      } else {
        db.prepare(
          `INSERT INTO user_word_progress (id, user_id, word_id, status, review_count, last_reviewed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
        ).run(crypto.randomUUID(), userId, wordId, status, now, now, now)
      }
    }

    // 获取更新后的单词（含用户进度）
    const getStmt = db.prepare(`
      SELECT w.*,
        COALESCE(uwp.status, 'unknown') as user_status,
        COALESCE(uwp.review_count, 0) as user_review_count,
        uwp.next_review_at as user_next_review_at
      FROM words w
      LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ?
      WHERE w.id = ?
    `)
    const row = getStmt.get(userId, wordId) as any
    const updatedWord: Word = {
      id: row.id,
      wordbookId: row.wordbook_id,
      word: row.word,
      phonetic: row.phonetic,
      partOfSpeech: row.part_of_speech,
      meaningCn: row.meaning_cn,
      meaningEn: row.meaning_en,
      example: row.example,
      audioUrl: row.audio_url,
      status: row.user_status,
      reviewCount: row.user_review_count,
      nextReviewAt: row.user_next_review_at,
      createdAt: row.created_at,
    }

    res.json({ success: true, data: updatedWord })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update word' })
  }
})

// 删除单词
router.delete('/:id', (req: Request, res: Response) => {
  try {
    // 先获取单词的wordbookId
    const getStmt = db.prepare('SELECT wordbook_id FROM words WHERE id = ?')
    const wordRow = getStmt.get(req.params.id) as any

    if (!wordRow) {
      return res.status(404).json({ success: false, error: 'Word not found' })
    }

    const wordbookId = wordRow.wordbook_id

    // 删除单词
    const stmt = db.prepare('DELETE FROM words WHERE id = ?')
    const result = stmt.run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Word not found' })
    }

    // 更新词书的单词数量
    const now = new Date().toISOString()
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM words WHERE wordbook_id = ?')
    const countResult = countStmt.get(wordbookId) as any
    const updateStmt = db.prepare(
      'UPDATE wordbooks SET word_count = ?, updated_at = ? WHERE id = ?'
    )
    updateStmt.run(countResult.count, now, wordbookId)

    res.json({ success: true, message: 'Word deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete word' })
  }
})

// 批量更新单词状态（写入用户进度表）
router.post('/batch-status', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { wordIds, status } = req.body
    const now = new Date().toISOString()

    for (const wordId of wordIds) {
      const existingProgress = db.prepare(
        'SELECT id FROM user_word_progress WHERE user_id = ? AND word_id = ?'
      ).get(userId, wordId) as any

      if (existingProgress) {
        db.prepare(
          `UPDATE user_word_progress SET status = ?, review_count = review_count + 1, updated_at = ?
           WHERE user_id = ? AND word_id = ?`
        ).run(status, now, userId, wordId)
      } else {
        db.prepare(
          `INSERT INTO user_word_progress (id, user_id, word_id, status, review_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`
        ).run(crypto.randomUUID(), userId, wordId, status, now, now)
      }
    }

    res.json({ success: true, message: 'Words updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update words' })
  }
})

export default router
