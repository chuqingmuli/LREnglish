import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

// 先检查数据库中的词书
console.log('当前数据库中的词书:');
const wordbooksBefore = db.prepare('SELECT * FROM wordbooks').all();
console.log(wordbooksBefore);

// 清空词书
console.log('\n清空词书...');
db.prepare('DELETE FROM wordbooks').run();

// 测试导入
console.log('\n开始导入词书...');
const wordbooksDir = path.join(__dirname, '../data/wordbooks');
const files = fs.readdirSync(wordbooksDir).filter(file => file.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(wordbooksDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const wordbookData = JSON.parse(content);

    const wordbookId = 'system-' + path.basename(file, '.json');

    console.log(`正在导入: ${wordbookData.name} (${wordbookData.words?.length || 0} 词)`);

    db.prepare(`
      INSERT INTO wordbooks (id, name, description, type, word_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(wordbookId, wordbookData.name, wordbookData.description, 'system', wordbookData.words?.length || 0);

    if (wordbookData.words && wordbookData.words.length > 0) {
      const insertWord = db.prepare(`
        INSERT INTO words (id, wordbook_id, word, phonetic, part_of_speech, meaning_cn, meaning_en, example, collins, oxford, bnc, frq, exchange, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < wordbookData.words.length; i++) {
        const word = wordbookData.words[i];
        const wordId = wordbookId + '-word-' + i;
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
        );
      }
    }

    console.log(`✅ ${wordbookData.name} 导入成功`);
  } catch (error) {
    console.error(`❌ 导入词书失败 ${file}:`, error);
  }
}

console.log('\n导入完成！当前词书:');
const wordbooksAfter = db.prepare('SELECT * FROM wordbooks').all();
console.log(wordbooksAfter);

db.close();
