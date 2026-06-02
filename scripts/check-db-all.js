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
console.log('📚 完整词书列表:');
console.log('');
const wordbooks = db.prepare('SELECT * FROM wordbooks').all();
for (const wb of wordbooks) {
  console.log(`  - ${wb.name} (${wb.type}): ${wb.word_count} 个单词`);
  console.log(`    描述: ${wb.description}`);
  console.log('');
}

db.close();
