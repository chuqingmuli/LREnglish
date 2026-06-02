import express, { type Request, type Response } from 'express'
import db from '../db/index.js'
import type { WordBook, Word } from '../../shared/types.js'

const router = express.Router()

// 获取所有词书
router.get('/', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM wordbooks ORDER BY updated_at DESC')
    const wordbooks = stmt.all().map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      wordCount: row.word_count,
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) as WordBook[]

    res.json({ success: true, data: wordbooks })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch wordbooks' })
  }
})

// 创建新词书
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, type = 'custom' } = req.body
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const stmt = db.prepare(
      'INSERT INTO wordbooks (id, name, description, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    stmt.run(id, name, description, type, now, now)

    const newWordbook: WordBook = {
      id,
      name,
      description,
      type: type as 'built-in' | 'custom',
      wordCount: 0,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }

    res.json({ success: true, data: newWordbook })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create wordbook' })
  }
})

// 获取单个词书
router.get('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM wordbooks WHERE id = ?')
    const row = stmt.get(req.params.id) as any

    if (!row) {
      return res.status(404).json({ success: false, error: 'Wordbook not found' })
    }

    const wordbook: WordBook = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      wordCount: row.word_count,
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    res.json({ success: true, data: wordbook })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch wordbook' })
  }
})

// 更新词书
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body
    const now = new Date().toISOString()

    const stmt = db.prepare(
      'UPDATE wordbooks SET name = ?, description = ?, updated_at = ? WHERE id = ?'
    )
    const result = stmt.run(name, description, now, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Wordbook not found' })
    }

    res.json({ success: true, message: 'Wordbook updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update wordbook' })
  }
})

// 删除词书
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM wordbooks WHERE id = ?')
    const result = stmt.run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Wordbook not found' })
    }

    res.json({ success: true, message: 'Wordbook deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete wordbook' })
  }
})

// 获取词书的单词
router.get('/:id/words', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM words WHERE wordbook_id = ? ORDER BY created_at')
    const words = stmt.all(req.params.id).map((row: any) => ({
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
    })) as Word[]

    res.json({ success: true, data: words })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch words' })
  }
})

// 添加单词到词书
router.post('/:id/words', (req: Request, res: Response) => {
  try {
    const { words } = req.body
    const wordbookId = req.params.id
    const now = new Date().toISOString()

    const insertStmt = db.prepare(
      `INSERT INTO words (id, wordbook_id, word, phonetic, part_of_speech, meaning_cn, meaning_en, example, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    const insertedWords: Word[] = []

    for (const wordData of words) {
      const id = crypto.randomUUID()
      insertStmt.run(
        id,
        wordbookId,
        wordData.word,
        wordData.phonetic || null,
        wordData.partOfSpeech || null,
        wordData.meaningCn || null,
        wordData.meaningEn || null,
        wordData.example || null,
        wordData.status || 'unknown',
        now
      )

      insertedWords.push({
        id,
        wordbookId,
        word: wordData.word,
        phonetic: wordData.phonetic,
        partOfSpeech: wordData.partOfSpeech,
        meaningCn: wordData.meaningCn,
        meaningEn: wordData.meaningEn,
        example: wordData.example,
        status: wordData.status || 'unknown',
        reviewCount: 0,
        createdAt: now,
      })
    }

    // 更新词书的单词数量
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM words WHERE wordbook_id = ?')
    const countResult = countStmt.get(wordbookId) as any
    const updateStmt = db.prepare(
      'UPDATE wordbooks SET word_count = ?, updated_at = ? WHERE id = ?'
    )
    updateStmt.run(countResult.count, now, wordbookId)

    res.json({ success: true, data: insertedWords })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add words' })
  }
})

export default router
