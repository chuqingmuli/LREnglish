import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
console.log('导入词书到数据库:', dbPath);
console.log('');

const db = new Database(dbPath);

// 清空旧词书
db.prepare('DELETE FROM words').run();
db.prepare('DELETE FROM wordbooks').run();
console.log('已清空旧词书');
console.log('');

// 遍历并导入所有 ECDICT 词书
const wordbooksDir = path.join(__dirname, '../data/wordbooks');
const files = fs.readdirSync(wordbooksDir).filter(file => file.endsWith('.json') && !file.includes('README'));

console.log(`找到 ${files.length} 个词书文件准备导入:`);
for (const file of files) {
  console.log(`  - ${file}`);
}
console.log('');

for (const file of files) {
  const filePath = path.join(wordbooksDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const wordbookData = JSON.parse(content);

    const wordbookId = 'system-' + path.basename(file, '.json');

    console.log(`正在导入: ${wordbookData.name} (${file})`);

    // 插入词书
    db.prepare(`
      INSERT INTO wordbooks (id, name, description, type, word_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(wordbookId, wordbookData.name, wordbookData.description, 'system', wordbookData.words?.length || 0);

    // 分批插入单词，避免内存溢出
    if (wordbookData.words && wordbookData.words.length > 0) {
      const insertWord = db.prepare(`
        INSERT INTO words (id, wordbook_id, word, phonetic, part_of_speech, meaning_cn, meaning_en, example, collins, oxford, bnc, frq, exchange, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const BATCH_SIZE = 1000;
      for (let batchStart = 0; batchStart < wordbookData.words.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, wordbookData.words.length);
        
        const insertBatch = db.transaction(() => {
          for (let i = batchStart; i < batchEnd; i++) {
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
        });
        
        insertBatch();
        
        if (wordbookData.words.length > BATCH_SIZE) {
          console.log(`  已完成: ${Math.min(batchEnd, wordbookData.words.length)}/${wordbookData.words.length}`);
        }
      }
    }

    console.log(`✅ 成功导入: ${wordbookData.name} (${wordbookData.words?.length || 0} 个单词)`);
    console.log('');
  } catch (error) {
    console.error(`❌ 导入词书失败 ${file}:`, error);
  }
}

console.log('');
console.log('📚 所有词书导入完成！');
console.log('');
console.log('词书列表:');
const allWordbooks = db.prepare('SELECT * FROM wordbooks').all();
for (const wb of allWordbooks) {
  console.log(`  - ${wb.name}: ${wb.word_count} 个单词`);
}

db.close();
