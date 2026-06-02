import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { Word } from '../../shared/types.js'

const router = express.Router()

// 更新单词
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { word, phonetic, partOfSpeech, meaningCn, meaningEn, example, status } = req.body
    const now = new Date().toISOString()

    const stmt = db.prepare(
      `UPDATE words 
       SET word = COALESCE(?, word), 
           phonetic = COALESCE(?, phonetic), 
           part_of_speech = COALESCE(?, part_of_speech), 
           meaning_cn = COALESCE(?, meaning_cn), 
           meaning_en = COALESCE(?, meaning_en), 
           example = COALESCE(?, example), 
           status = COALESCE(?, status)
       WHERE id = ?`
    )
    const result = stmt.run(word, phonetic, partOfSpeech, meaningCn, meaningEn, example, status, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Word not found' })
    }

    // 获取更新后的单词
    const getStmt = db.prepare('SELECT * FROM words WHERE id = ?')
    const row = getStmt.get(req.params.id) as any
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
      status: row.status,
      reviewCount: row.review_count,
      nextReviewAt: row.next_review_at,
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

// 批量更新单词状态
router.post('/batch-status', (req: Request, res: Response) => {
  try {
    const { wordIds, status } = req.body

    for (const wordId of wordIds) {
      const stmt = db.prepare('UPDATE words SET status = ?, review_count = review_count + 1 WHERE id = ?')
      stmt.run(status, wordId)
    }

    res.json({ success: true, message: 'Words updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update words' })
  }
})

export default router
