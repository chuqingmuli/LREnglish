import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

console.log('正在删除旧词书...');

// 删除所有词书及其单词
const deleteResult = db.prepare(`
  DELETE FROM wordbooks
`).run();

console.log(`✓ 删除了 ${deleteResult.changes} 个词书`);

console.log('\n开始导入新词书...');

const wordbooksDir = path.join(__dirname, '../data/wordbooks');
const files = fs.readdirSync(wordbooksDir).filter(file => file.endsWith('.json') && !file.includes('README'));

for (const file of files) {
  const filePath = path.join(wordbooksDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const wordbookData = JSON.parse(content);

    const wordbookId = 'system-' + path.basename(file, '.json');

    console.log(`\n正在导入: ${wordbookData.name}`);

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

    console.log(`✓ 成功导入: ${wordbookData.name} (${wordbookData.words?.length || 0} 词)`);
  } catch (error) {
    console.error(`✗ 导入词书失败 ${file}:`, error);
  }
}

console.log('\n✅ 词书导入完成！');
console.log('\n当前词书列表:');
const currentWordbooks = db.prepare('SELECT * FROM wordbooks').all();
for (const wb of currentWordbooks) {
  console.log(`  - ${wb.name} (${wb.word_count} 词)`);
}

db.close();
