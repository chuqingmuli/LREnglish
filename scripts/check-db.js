import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
console.log('检查数据库:', dbPath);
console.log('');

const db = new Database(dbPath);

// 查询词书
console.log('📚 词书列表:');
const wordbooks = db.prepare('SELECT * FROM wordbooks').all();
for (const wb of wordbooks) {
  console.log(`  - ${wb.name} (${wb.type}): ${wb.word_count} 个单词`);
  
  // 查看前5个单词
  const words = db.prepare('SELECT * FROM words WHERE wordbook_id = ? LIMIT 5').all(wb.id);
  console.log('    前5个单词:');
  for (const w of words) {
    console.log(`      ${w.word}`);
    console.log(`        中文: ${w.meaning_cn?.substring(0, 50)}${w.meaning_cn?.length > 50 ? '...' : ''}`);
    console.log(`        英文: ${w.meaning_en?.substring(0, 50)}${w.meaning_en?.length > 50 ? '...' : ''}`);
  }
  console.log('');
}

db.close();
