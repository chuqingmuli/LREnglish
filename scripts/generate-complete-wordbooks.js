import fs from 'fs';
import path from 'path';
import wordlist from 'wordlist-english';

// 获取常用单词（词频10-50的常用单词）
const commonWords = [...wordlist['english/10'], ...wordlist['english/20'], ...wordlist['english/35'], ...wordlist['english/40'], ...wordlist['english/50']];
const uniqueCommonWords = [...new Set(commonWords)];
console.log(`找到 ${uniqueCommonWords.length} 个常用单词`);

// 生成单词数组（暂时没有释义，先用简单的占位符）
function generateWord(word) {
  return {
    word: word,
    phonetic: '',
    part_of_speech: '',
    meaning_cn: '',
    meaning_en: '',
    collins: '',
    oxford: '',
    bnc: '',
    frq: '',
    tag: ''
  };
}

// 创建常用英语词书
const commonEnglishWordbook = {
  name: '常用英语词汇',
  description: '精选英语高频词汇（共' + uniqueCommonWords.length + '个），按词频排序',
  type: 'system',
  words: uniqueCommonWords.slice(0, 1000).map(generateWord) // 先取前1000个快速测试
};

// 创建进阶英语词书
const advancedWords = [...wordlist['english/55'], ...wordlist['english/60'], ...wordlist['english/70']];
const uniqueAdvancedWords = [...new Set(advancedWords)];
console.log(`找到 ${uniqueAdvancedWords.length} 个进阶单词`);

const advancedEnglishWordbook = {
  name: '进阶英语词汇',
  description: '进阶英语词汇（共' + uniqueAdvancedWords.length + '个）',
  type: 'system',
  words: uniqueAdvancedWords.slice(0, 500).map(generateWord) // 先取前500个快速测试
};

// 写入文件
const wordbooksDir = path.join(process.cwd(), 'data', 'wordbooks');
if (!fs.existsSync(wordbooksDir)) {
  fs.mkdirSync(wordbooksDir, { recursive: true });
}

fs.writeFileSync(
  path.join(wordbooksDir, 'common-english.json'),
  JSON.stringify(commonEnglishWordbook, null, 2)
);
console.log(`✓ 已生成常用英语词书：${commonEnglishWordbook.words.length} 个单词`);

fs.writeFileSync(
  path.join(wordbooksDir, 'advanced-english.json'),
  JSON.stringify(advancedEnglishWordbook, null, 2)
);
console.log(`✓ 已生成进阶英语词书：${advancedEnglishWordbook.words.length} 个单词`);

console.log('\n✅ 完整词书生成完成！');
console.log('现在请重启后端服务来导入新的词书！');
