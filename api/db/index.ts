import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../../data/db.sqlite')

import fs from 'fs'
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS wordbooks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'custom',
    word_count INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    wordbook_id TEXT NOT NULL,
    word TEXT NOT NULL,
    phonetic TEXT,
    part_of_speech TEXT,
    meaning_cn TEXT,
    meaning_en TEXT,
    example TEXT,
    audio_url TEXT,
    collins TEXT,
    oxford TEXT,
    bnc TEXT,
    frq TEXT,
    exchange TEXT,
    tag TEXT,
    status TEXT DEFAULT 'unknown',
    review_count INTEGER DEFAULT 0,
    next_review_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    wordbook_id TEXT NOT NULL,
    type TEXT NOT NULL,
    total_words INTEGER DEFAULT 0,
    completed_words INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    words_learned INTEGER DEFAULT 0,
    study_time INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
  )
`)

function importBuiltInWordbooks() {
  const wordbooksDir = path.join(__dirname, '../../data/wordbooks')

  if (!fs.existsSync(wordbooksDir)) {
    return
  }

  const files = fs.readdirSync(wordbooksDir).filter(file => file.endsWith('.json'))

  for (const file of files) {
    const filePath = path.join(wordbooksDir, file)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const wordbookData = JSON.parse(content)

      const wordbookId = 'system-' + path.basename(file, '.json')

      const existing = db.prepare('SELECT id FROM wordbooks WHERE id = ?').get(wordbookId)
      if (existing) {
        continue
      }

      db.prepare(`
        INSERT INTO wordbooks (id, name, description, type, word_count)
        VALUES (?, ?, ?, ?, ?)
      `).run(wordbookId, wordbookData.name, wordbookData.description, 'system', wordbookData.words?.length || 0)

      if (wordbookData.words && wordbookData.words.length > 0) {
        const insertWord = db.prepare(`
          INSERT INTO words (id, wordbook_id, word, phonetic, part_of_speech, meaning_cn, meaning_en, example, collins, oxford, bnc, frq, exchange, tag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (let i = 0; i < wordbookData.words.length; i++) {
          const word = wordbookData.words[i]
          const wordId = wordbookId + '-word-' + i
          insertWord.run(
            wordId,
            wordbookId,
            word.word,
            word.phonetic,
            word.part_of_speech,
            word.meaning_cn,
            word.meaning_en,
            word.example,
            word.collins,
            word.oxford,
            word.bnc,
            word.frq,
            word.exchange,
            word.tag
          )
        }
      }

      console.log(`✅ 导入内置词书: ${wordbookData.name} (${wordbookData.words?.length || 0} 词)`)
    } catch (error) {
      console.error(`❌ 导入词书失败 ${file}:`, error)
    }
  }
}

importBuiltInWordbooks()

export default db
