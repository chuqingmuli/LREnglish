import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

console.log('检查词书单词...');

// 获取所有词书
const wordbooks = db.prepare('SELECT * FROM wordbooks').all();
for (const wb of wordbooks) {
  console.log(`\n=== ${wb.name} (${wb.word_count} 词) ===`);
  // 获取前几个单词
  const words = db.prepare('SELECT * FROM words WHERE wordbook_id = ? LIMIT 5').all(wb.id);
  for (const word of words) {
    console.log(`${word.word}: ${word.meaning_cn || '(无中文释义)'}`);
  }
}

db.close();
