import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

console.log('当前数据库中的词书:');
const wordbooks = db.prepare('SELECT * FROM wordbooks').all();
console.log(wordbooks);

db.close();
