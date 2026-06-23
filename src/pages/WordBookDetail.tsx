import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Play, BookOpen, CheckCircle2, Clock, AlertCircle, Filter, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store'
import { Layout } from '../components/Layout'
import { batchWordsApi } from '../api'

export function WordBookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAddWord, setShowAddWord] = useState(false)
  const [newWordText, setNewWordText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const { currentWordbook, currentWords, loading, selectWordbook, addWords, deleteWord, updateWord, fetchDailyStats, updateDailyStats } = useAppStore()

  useEffect(() => {
    if (id) {
      selectWordbook(id)
    }
  }, [id])

  const handleAddWords = async () => {
    if (!id || !newWordText.trim()) return

    const lines = newWordText.trim().split('\n').filter(line => line.trim())
    const words = lines.map(line => {
      const trimmedLine = line.trim()

      const phoneticMatch = trimmedLine.match(/^(\S+)\s+([\/\[].+?[\/\]])\s*(.*)$/)
      if (phoneticMatch) {
        return {
          word: phoneticMatch[1],
          phonetic: phoneticMatch[2],
          meaningCn: phoneticMatch[3] || undefined
        }
      }

      const parts = trimmedLine.split(/[:：\t]+/)
      if (parts.length >= 2) {
        return {
          word: parts[0].trim(),
          meaningCn: parts.slice(1).join(' ').trim() || undefined
        }
      }

      const spaceParts = trimmedLine.split(/\s+/)
      if (spaceParts.length >= 2) {
        return {
          word: spaceParts[0],
          meaningCn: spaceParts.slice(1).join(' ') || undefined
        }
      }

      return { word: trimmedLine }
    }).filter(w => w.word)

    if (words.length > 0) {
      await addWords(id, words)
      setShowAddWord(false)
      setNewWordText('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-700'
      case 'learning':
        return 'bg-yellow-100 text-yellow-700'
      case 'known':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'mastered':
        return '已掌握'
      case 'learning':
        return '学习中'
      case 'known':
        return '已认识'
      default:
        return '未学习'
    }
  }

  if (loading && !currentWordbook) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      </Layout>
    )
  }

  if (!currentWordbook) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-4">词书不存在</p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              返回首页
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const masteredCount = currentWords.filter(w => w.status === 'mastered').length
  const learningCount = currentWords.filter(w => w.status === 'learning').length
  const knownCount = currentWords.filter(w => w.status === 'known').length
  const unknownCount = currentWords.filter(w => w.status === 'unknown').length

  return (
    <Layout>
      <div className="p-6 lg:ml-56">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{currentWordbook.name}</h1>
            {currentWordbook.description && (
              <p className="text-sm text-slate-400">{currentWordbook.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-black text-blue-600">{currentWords.length}</p>
            <p className="text-xs text-slate-400 mt-1">单词总数</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-black text-purple-600">{unknownCount}</p>
            <p className="text-xs text-slate-400 mt-1">待学习</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-black text-yellow-600">{learningCount}</p>
            <p className="text-xs text-slate-400 mt-1">学习中</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-black text-green-600">{knownCount}</p>
            <p className="text-xs text-slate-400 mt-1">已认识</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-black text-emerald-600">{masteredCount}</p>
            <p className="text-xs text-slate-400 mt-1">已掌握</p>
          </div>
        </div>

        {/* 重置按钮 */}
        {(knownCount > 0 || learningCount > 0 || masteredCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">已筛选 {knownCount} 个认识的单词</p>
                <p className="text-xs text-amber-600 mt-1">点击重置可以将所有单词状态恢复为未学习，方便重新测试</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('确定要重置所有单词状态吗？这将清空所有学习进度。')) {
                    // 收集所有需要重置的单词ID
                    const wordIds = currentWords
                      .filter(w => w.status !== 'unknown')
                      .map(w => w.id)

                    // 批量更新所有单词状态为 unknown
                    if (wordIds.length > 0) {
                      await batchWordsApi.updateStatus(wordIds, 'unknown')
                    }

                    // 重置今日学习统计
                    await updateDailyStats({
                      wordsLearned: 0,
                      completed: false,
                    })

                    // 重新加载词书和统计
                    if (id) {
                      await selectWordbook(id)
                    }
                    await fetchDailyStats()
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置词书
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {currentWords.filter(w => w.status === 'unknown').length > 0 && (
            <button
              onClick={() => navigate(`/screen/${id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-medium transition-all shadow-md"
            >
              <Filter className="w-4 h-4" />
              开始筛词
            </button>
          )}
          {currentWords.filter(w => w.status === 'unknown').length > 0 && (
            <button
              onClick={() => navigate(`/study/${id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              开始学习
            </button>
          )}
          <button
            onClick={() => setShowAddWord(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加单词
          </button>
        </div>

        {/* Word List */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-600">单词列表 · {currentWords.length}</h2>
          </div>

          {currentWords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">还没有单词</h3>
              <p className="text-sm text-slate-400 mb-4">手动添加或从文件导入单词</p>
              <button
                onClick={() => setShowAddWord(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加单词
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {(() => {
                  const startIndex = (currentPage - 1) * pageSize
                  const endIndex = startIndex + pageSize
                  const pageWords = currentWords.slice(startIndex, endIndex)
                  return pageWords.map((word) => (
                    <div key={word.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-bold text-slate-900">{word.word}</span>
                          {word.phonetic && (
                            <span className="text-xs text-slate-400 font-mono truncate">{word.phonetic}</span>
                          )}
                        </div>
                        {word.meaningCn && (
                          <p className="text-sm text-slate-500 line-clamp-1">{word.meaningCn}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(word.status)}`}>
                          {getStatusText(word.status)}
                        </span>
                        <button
                          onClick={() => deleteWord(word.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
              
              {/* Pagination controls */}
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  共 {currentWords.length} 个单词 · 第 {currentPage} / {Math.ceil(currentWords.length / pageSize)} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(currentWords.length / pageSize), currentPage + 1))}
                    disabled={currentPage >= Math.ceil(currentWords.length / pageSize)}
                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Word Modal */}
        {showAddWord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-slate-900 mb-4">批量添加单词</h3>
              <textarea
                value={newWordText}
                onChange={(e) => setNewWordText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                placeholder="apple 苹果
banana 香蕉
orange 橙子"
                rows={8}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowAddWord(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddWords}
                  disabled={!newWordText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </Layout>
  )
}
