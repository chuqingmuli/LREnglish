
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../data/db.sqlite')

console.log('修复词书类型...')
console.log('')

const db = new Database(dbPath)

// 更新词书类型：将 'system' 改为 'built-in'
const updateStmt = db.prepare("UPDATE wordbooks SET type = 'built-in' WHERE type = 'system'")
const result = updateStmt.run()
console.log(`✅ 更新了 ${result.changes} 个词书的类型`)

// 验证更新
const wordbooks = db.prepare('SELECT id, name, type FROM wordbooks').all()
console.log('')
console.log('📚 当前词书列表:')
for (const wb of wordbooks) {
  console.log(`- ${wb.name}: ${wb.type}`)
}

db.close()

console.log('')
console.log('修复完成！')

