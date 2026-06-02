# ECDICT 集成指南

## 概述

本项目已集成 [ECDICT](https://github.com/skywind3000/ECDICT) - 一个免费的英汉双语词典数据库，包含超过 340 万词条。

## 快速开始

### 1. 使用示例词书（无需下载）

我们已经提供了一个示例词书，你可以直接使用：

- **常用英语词汇** (`data/wordbooks/common-english.json`)
- **大学英语四级词汇（基础）** (`data/wordbooks/cet4-basic.json`)

重启后端服务后，这些词书会自动导入。

### 2. 下载完整 ECDICT 数据

如果需要生成更多词书（如完整的四级、六级、雅思、托福等）：

1. 访问 ECDICT 项目页面：https://github.com/skywind3000/ECDICT
2. 下载 `ecdict.csv` 文件（约 300MB）
3. 将其放置在 `data/ecdict/` 目录下

```bash
mkdir -p data/ecdict
# 下载并放置 ecdict.csv 到该目录
```

4. 安装依赖并运行转换脚本：

```bash
cd d:\zuoyouyingyu
npm install csv-parser
node scripts/ecdict-converter.js
```

## 自动生成的词书

转换脚本会自动生成以下词书：

| 词书名称 | 单词数量 | 说明 |
|---------|---------|------|
| 中考英语词汇 | 2000 | 中考必备核心词汇 |
| 高考英语词汇 | 3500 | 高考必备核心词汇 |
| 大学英语四级词汇 | 5000 | 大学英语四级考试核心词汇 |
| 大学英语六级词汇 | 6000 | 大学英语六级考试核心词汇 |
| 雅思词汇 | 8000 | 雅思考试核心词汇 |
| 托福词汇 | 10000 | 托福考试核心词汇 |
| GRE词汇 | 15000 | GRE考试核心词汇 |
| 牛津核心3000词 | 3000 | 牛津3000核心英语词汇 |
| 高频英语词汇 | 10000 | 英语语料库前10000高频词汇 |

## 添加自定义词书

### 方法1：创建 JSON 文件

在 `data/wordbooks/` 目录下创建 JSON 文件：

```json
{
  "name": "我的词书",
  "description": "词书描述",
  "type": "system",
  "words": [
    {
      "word": "apple",
      "phonetic": "/ˈæpl/",
      "part_of_speech": "n",
      "meaning_cn": "苹果",
      "meaning_en": "a round fruit with red, green, or yellow skin",
      "collins": "5",
      "oxford": "1",
      "tag": "zk gk"
    }
  ]
}
```

### 方法2：通过前端添加

在前端词书详情页，点击"添加单词"，支持批量粘贴。

## 词书字段说明

### 词书字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| name | string | 是 | 词书名称 |
| description | string | 否 | 词书描述 |
| type | string | 是 | 固定为 'system' |
| words | array | 是 | 单词数组 |

### 单词字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| word | string | 是 | 单词 |
| phonetic | string | 否 | 音标 |
| part_of_speech | string | 否 | 词性 |
| meaning_cn | string | 否 | 中文释义 |
| meaning_en | string | 否 | 英文释义 |
| example | string | 否 | 例句 |
| collins | string | 否 | 柯林斯星级 |
| oxford | string | 否 | 是否牛津3000词 |
| bnc | string | 否 | BNC语料库词频 |
| frq | string | 否 | 当代语料库词频 |
| exchange | string | 否 | 词形变化 |
| tag | string | 否 | 标签（空格分隔） |

## 词形变化说明

exchange 字段格式：`类型1:单词1/类型2:单词2`

| 类型代码 | 说明 | 示例 |
|---------|------|------|
| p | 过去式 | p:did |
| d | 过去分词 | d:done |
| i | 现在分词 | i:doing |
| 3 | 第三人称单数 | 3:does |
| r | 形容词比较级 | r:better |
| t | 形容词最高级 | t:best |
| s | 名词复数 | s:apples |
| 0 | 原型 | 0:do |
| 1 | 原型变换形式 | 1:doing |

## 标签说明

| 标签 | 说明 |
|------|------|
| zk | 中考 |
| gk | 高考 |
| cet4 | 大学英语四级 |
| cet6 | 大学英语六级 |
| ielts | 雅思 |
| toefl | 托福 |
| gre | GRE |

## 自定义转换脚本

如果需要自定义筛选条件，修改 `scripts/ecdict-converter.js` 中的 `WORDBOOK_CONFIGS` 配置。

## 注意事项

1. **重启服务生效**：添加或修改词书后，需要重启后端服务
2. **不重复导入**：已导入的词书不会重复导入
3. **删除词书**：如需重新导入词书，需要先从数据库中删除
4. **文件编码**：JSON 文件必须使用 UTF-8 编码

## 数据库结构

### wordbooks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 词书ID |
| name | TEXT | 词书名称 |
| description | TEXT | 词书描述 |
| type | TEXT | 类型（system/custom） |
| word_count | INTEGER | 单词数 |
| progress | INTEGER | 进度 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### words 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 单词ID |
| wordbook_id | TEXT | 所属词书ID |
| word | TEXT | 单词 |
| phonetic | TEXT | 音标 |
| part_of_speech | TEXT | 词性 |
| meaning_cn | TEXT | 中文释义 |
| meaning_en | TEXT | 英文释义 |
| example | TEXT | 例句 |
| collins | TEXT | 柯林斯星级 |
| oxford | TEXT | 牛津3000词 |
| bnc | TEXT | BNC词频 |
| frq | TEXT | 当代语料库词频 |
| exchange | TEXT | 词形变化 |
| tag | TEXT | 标签 |
| status | TEXT | 学习状态 |
| review_count | INTEGER | 复习次数 |
| next_review_at | DATETIME | 下次复习时间 |
| created_at | DATETIME | 创建时间 |

## 故障排除

### 问题：词书没有导入

检查：
1. JSON 文件格式是否正确
2. 文件是否在 `data/wordbooks/` 目录下
3. 后端服务是否重启

### 问题：转换脚本失败

检查：
1. `ecdict.csv` 文件是否在 `data/ecdict/` 目录
2. 是否已安装 `csv-parser` 依赖
3. 文件编码是否为 UTF-8

## 许可证

ECDICT 遵循其自身的开源许可证。请访问 https://github.com/skywind3000/ECDICT 了解详情。
