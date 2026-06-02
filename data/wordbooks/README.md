# 内置词书说明

## 存放位置
将你的词书 JSON 文件放在此目录下，后端启动时会自动导入。

## 文件格式
每个词书是一个独立的 JSON 文件，文件名作为词书 ID 的一部分（会自动添加 `system-` 前缀）。

## JSON 结构
```json
{
  "name": "词书名称",
  "description": "词书描述",
  "type": "system",
  "words": [
    {
      "word": "单词",
      "phonetic": "/音标/",
      "part_of_speech": "词性",
      "meaning_cn": "中文释义",
      "meaning_en": "英文释义",
      "example": "例句"
    }
  ]
}
```

## 字段说明
- `name` (必填): 词书名称
- `description` (可选): 词书描述
- `type` (必填): 固定为 "system"
- `words` (必填): 单词数组

## 单词字段
- `word` (必填): 单词
- `phonetic` (可选): 音标，如 `/ˈæpl/`
- `part_of_speech` (可选): 词性，如 "n.", "v.", "adj."
- `meaning_cn` (可选): 中文释义
- `meaning_en` (可选): 英文释义
- `example` (可选): 例句

## 示例
见 `cet4-basic.json` 示例文件。

## 注意事项
1. 文件名必须以 `.json` 结尾
2. 重启后端服务后，新添加的词书会自动导入
3. 已导入的词书不会重复导入
4. 内置词书在数据库中以 `system-` 开头的 ID 标识
