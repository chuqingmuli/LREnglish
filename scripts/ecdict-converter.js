import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECDICT_PATH = path.join(__dirname, '../data/ecdict/ecdict.csv');
const OUTPUT_DIR = path.join(__dirname, '../data/wordbooks');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 词书配置
const WORDBOOK_CONFIGS = [
  {
    id: 'cet4',
    name: '大学英语四级词汇',
    description: '大学英语四级考试核心词汇',
    tags: ['cet4'],
    maxWords: 5000
  },
  {
    id: 'cet6',
    name: '大学英语六级词汇',
    description: '大学英语六级考试核心词汇',
    tags: ['cet6'],
    maxWords: 6000
  },
  {
    id: 'gk',
    name: '高考英语词汇',
    description: '高考英语必备核心词汇',
    tags: ['gk'],
    maxWords: 3500
  },
  {
    id: 'zk',
    name: '中考英语词汇',
    description: '中考英语必备核心词汇',
    tags: ['zk'],
    maxWords: 2000
  },
  {
    id: 'ielts',
    name: '雅思词汇',
    description: '雅思考试核心词汇',
    tags: ['ielts'],
    maxWords: 8000
  },
  {
    id: 'toefl',
    name: '托福词汇',
    description: '托福考试核心词汇',
    tags: ['toefl'],
    maxWords: 10000
  },
  {
    id: 'gre',
    name: 'GRE词汇',
    description: 'GRE考试核心词汇',
    tags: ['gre'],
    maxWords: 15000
  },
  {
    id: 'oxford-3000',
    name: '牛津核心3000词',
    description: '牛津3000核心英语词汇',
    oxford: true,
    maxWords: 3000
  },
  {
    id: 'high-frequency',
    name: '高频英语词汇',
    description: '英语语料库前10000高频词汇',
    sortByFrq: true,
    maxWords: 10000
  }
];

// 解析 CSV
function parseECDict() {
  return new Promise((resolve, reject) => {
    const words = [];
    
    if (!fs.existsSync(ECDICT_PATH)) {
      console.log('ECDICT CSV 文件不存在，跳过转换');
      resolve([]);
      return;
    }

    fs.createReadStream(ECDICT_PATH, 'utf8')
      .pipe(csvParser())
      .on('data', (row) => {
        words.push(row);
      })
      .on('end', () => {
        console.log(`成功解析 ${words.length} 个单词`);
        resolve(words);
      })
      .on('error', reject);
  });
}

// 转换单个单词
function convertWord(ecdictWord) {
  const word = {
    word: ecdictWord.word,
    phonetic: ecdictWord.phonetic || '',
    meaning_cn: ecdictWord.translation || '',
    meaning_en: ecdictWord.definition || '',
    part_of_speech: ecdictWord.pos || '',
    collins: ecdictWord.collins || '',
    oxford: ecdictWord.oxford || '',
    bnc: ecdictWord.bnc || '',
    frq: ecdictWord.frq || '',
    example: '',
    exchange: ecdictWord.exchange || '',
    tag: ecdictWord.tag || ''
  };
  
  // 只保留第一个中文释义
  if (word.meaning_cn) {
    const cnLines = word.meaning_cn.split('\n');
    word.meaning_cn = cnLines[0].trim();
  }
  
  // 只保留第一个英文释义
  if (word.meaning_en) {
    const enLines = word.meaning_en.split('\n');
    word.meaning_en = enLines[0].trim();
  }
  
  return word;
}

// 生成词书
async function generateWordbooks() {
  console.log('开始转换 ECDICT 数据...');
  
  const ecdictWords = await parseECDict();
  
  if (ecdictWords.length === 0) {
    console.log('没有找到 ECDICT 数据，请先下载 ecdict.csv');
    console.log('下载地址: https://github.com/skywind3000/ECDICT');
    return;
  }

  for (const config of WORDBOOK_CONFIGS) {
    console.log(`\n正在生成词书: ${config.name}`);
    
    let filteredWords = [...ecdictWords];
    
    // 根据标签过滤
    if (config.tags && config.tags.length > 0) {
      filteredWords = filteredWords.filter(word => {
        const wordTags = (word.tag || '').split(' ');
        return config.tags.some(tag => wordTags.includes(tag));
      });
    }
    
    // 牛津3000词
    if (config.oxford) {
      filteredWords = filteredWords.filter(word => word.oxford === '1');
    }
    
    // 按词频排序
    if (config.sortByFrq) {
      filteredWords.sort((a, b) => {
        const frqA = parseInt(a.frq) || 999999;
        const frqB = parseInt(b.frq) || 999999;
        return frqA - frqB;
      });
    } else {
      // 默认按 bnc 词频排序
      filteredWords.sort((a, b) => {
        const bncA = parseInt(a.bnc) || 999999;
        const bncB = parseInt(b.bnc) || 999999;
        return bncA - bncB;
      });
    }
    
    // 限制数量
    if (config.maxWords) {
      filteredWords = filteredWords.slice(0, config.maxWords);
    }
    
    console.log(`找到 ${filteredWords.length} 个单词`);
    
    // 转换单词
    const convertedWords = filteredWords.map(convertWord);
    
    // 生成词书对象
    const wordbook = {
      name: config.name,
      description: config.description,
      type: 'system',
      words: convertedWords
    };
    
    // 写入文件
    const outputPath = path.join(OUTPUT_DIR, `${config.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(wordbook, null, 2));
    
    console.log(`✓ 已保存到: ${outputPath}`);
  }
  
  console.log('\n✅ 词书生成完成！');
}

generateWordbooks().catch(console.error);
