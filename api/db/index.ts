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
    daily_goal INTEGER DEFAULT 20,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// 兼容旧表：如果 users 表没有 daily_goal 字段则添加
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[]
  const hasDailyGoal = userColumns.some(col => col.name === 'daily_goal')
  if (!hasDailyGoal) {
    db.exec('ALTER TABLE users ADD COLUMN daily_goal INTEGER DEFAULT 20')
    console.log('✅ 已为 users 表添加 daily_goal 字段')
  }
} catch (error) {
  console.error('检查/添加 daily_goal 字段失败:', error)
}

db.exec(`
  CREATE TABLE IF NOT EXISTS wordbooks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
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

// 兼容旧表：如果 wordbooks 表的 user_id 是 NOT NULL，重建表允许 NULL
try {
  const wbColumns = db.prepare("PRAGMA table_info(wordbooks)").all() as any[]
  const userIdCol = wbColumns.find(col => col.name === 'user_id')
  if (userIdCol && userIdCol.notnull === 1) {
    // 重建表，user_id 允许 NULL
    db.exec(`
      CREATE TABLE IF NOT EXISTS wordbooks_new (
        id TEXT PRIMARY KEY,
        user_id TEXT,
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
      INSERT INTO wordbooks_new (id, user_id, name, description, type, word_count, progress, created_at, updated_at)
      SELECT id, user_id, name, description, type, word_count, progress, created_at, updated_at
      FROM wordbooks
    `)
    db.exec('DROP TABLE wordbooks')
    db.exec('ALTER TABLE wordbooks_new RENAME TO wordbooks')
    console.log('✅ wordbooks 表迁移完成，user_id 允许 NULL')
  }
} catch (error) {
  console.error('wordbooks 表迁移失败:', error)
}

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
    words_forget INTEGER DEFAULT 0,
    study_time INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
  )
`)

// 兼容旧表：如果 daily_stats 表没有 words_forget 字段则添加
try {
  const statsColumns = db.prepare("PRAGMA table_info(daily_stats)").all() as any[]
  const hasWordsForget = statsColumns.some(col => col.name === 'words_forget')
  if (!hasWordsForget) {
    db.exec('ALTER TABLE daily_stats ADD COLUMN words_forget INTEGER DEFAULT 0')
    console.log('✅ 已为 daily_stats 表添加 words_forget 字段')
  }
} catch (error) {
  console.error('检查/添加 words_forget 字段失败:', error)
}

// 兼容旧表：如果 daily_stats 表没有 user_id 字段则添加并迁移数据
try {
  const statsColumns = db.prepare("PRAGMA table_info(daily_stats)").all() as any[]
  const hasUserId = statsColumns.some(col => col.name === 'user_id')
  if (!hasUserId) {
    db.exec('ALTER TABLE daily_stats ADD COLUMN user_id TEXT')
    console.log('✅ 已为 daily_stats 表添加 user_id 字段')

    // 找到第一个用户作为默认关联
    const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at LIMIT 1').get() as any
    if (firstUser) {
      db.prepare('UPDATE daily_stats SET user_id = ? WHERE user_id IS NULL').run(firstUser.id)
      console.log(`✅ 已将旧 daily_stats 数据迁移到用户 ${firstUser.id}`)
    }

    // 添加唯一约束（SQLite 不能直接 ADD CONSTRAINT，需要重建表）
    // 先创建新表
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_stats_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        words_learned INTEGER DEFAULT 0,
        words_forget INTEGER DEFAULT 0,
        study_time INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, date)
      )
    `)
    // 复制数据
    db.exec(`
      INSERT INTO daily_stats_new (id, user_id, date, words_learned, words_forget, study_time, accuracy, completed)
      SELECT id, user_id, date, words_learned, words_forget, study_time, accuracy, completed
      FROM daily_stats
      WHERE user_id IS NOT NULL
    `)
    // 替换表
    db.exec('DROP TABLE daily_stats')
    db.exec('ALTER TABLE daily_stats_new RENAME TO daily_stats')
    console.log('✅ daily_stats 表迁移完成，已添加 user_id 唯一约束')
  }
} catch (error) {
  console.error('检查/添加 daily_stats user_id 字段失败:', error)
}

// 用户单词进度表：每个用户对每个单词有独立的学习状态
db.exec(`
  CREATE TABLE IF NOT EXISTS user_word_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    word_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unknown',
    review_count INTEGER DEFAULT 0,
    next_review_at DATETIME,
    last_reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(user_id, word_id)
  )
`)

// 迁移旧数据：把 words 表中的 status/review_count/next_review_at 迁移到 user_word_progress
try {
  const progressCount = (db.prepare('SELECT COUNT(*) as count FROM user_word_progress').get() as any).count
  if (progressCount === 0) {
    // 表为空，需要迁移旧数据
    const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at LIMIT 1').get() as any
    if (firstUser) {
      const wordsWithStatus = db.prepare(
        "SELECT id, status, review_count, next_review_at FROM words WHERE status != 'unknown' OR review_count > 0"
      ).all() as any[]

      if (wordsWithStatus.length > 0) {
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO user_word_progress (id, user_id, word_id, status, review_count, next_review_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        for (const w of wordsWithStatus) {
          insertStmt.run(crypto.randomUUID(), firstUser.id, w.id, w.status, w.review_count, w.next_review_at)
        }
        console.log(`✅ 已迁移 ${wordsWithStatus.length} 条单词进度到 user_word_progress 表`)
      }
    }
  }
} catch (error) {
  console.error('迁移 user_word_progress 数据失败:', error)
}

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

      console.log(`📚 开始导入内置词书: ${wordbookData.name}...`)

      const insertWordbook = db.prepare(`
        INSERT INTO wordbooks (id, name, description, type, word_count)
        VALUES (?, ?, ?, ?, ?)
      `)

      const insertWord = db.prepare(`
        INSERT INTO words (id, wordbook_id, word, phonetic, part_of_speech, meaning_cn, meaning_en, example, collins, oxford, bnc, frq, exchange, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const importTransaction = db.transaction(() => {
        insertWordbook.run(wordbookId, wordbookData.name, wordbookData.description, 'system', wordbookData.words?.length || 0)

        if (wordbookData.words && wordbookData.words.length > 0) {
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
      })

      importTransaction()

      console.log(`✅ 导入内置词书: ${wordbookData.name} (${wordbookData.words?.length || 0} 词)`)
    } catch (error) {
      console.error(`❌ 导入词书失败 ${file}:`, error)
    }
  }
}

setTimeout(() => {
  importBuiltInWordbooks()
}, 100)

export default db
