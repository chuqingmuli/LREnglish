import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { WordCard } from '../components/WordCard'
import { ArrowLeft, CheckCircle2, XCircle, Eye, Filter, Target } from 'lucide-react'

export function Screen() {
  const { id: wordbookId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    currentWordbook,
    currentWords,
    selectWordbook,
    updateWord,
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 筛词设置
  const [screenCount, setScreenCount] = useState(100)
  const [showSettings, setShowSettings] = useState(true)

  // 筛词状态
  const [screenWords, setScreenWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [knownCount, setKnownCount] = useState(0)
  const [unknownCount, setUnknownCount] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  // 手势相关
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  // 初始化 - 只在首次加载时运行
  useEffect(() => {
    async function init() {
      if (!wordbookId) {
        setError('词书ID不存在')
        setLoading(false)
        return
      }

      try {
        // 如果当前词书不是目标词书，或者单词列表为空，则重新加载
        if (currentWordbook?.id !== wordbookId || currentWords.length === 0) {
          await selectWordbook(wordbookId)
        }
        setLoading(false)
      } catch (err) {
        console.error('初始化失败:', err)
        setError(err instanceof Error ? err.message : '未知错误')
        setLoading(false)
      }
    }
    init()
  }, [wordbookId])

  // 开始筛词
  const startScreening = () => {
    // 从当前词书中随机抽取指定数量的单词（只抽取未筛选过的）
    const unfilteredWords = currentWords.filter(w => w.status === 'unknown')
    const shuffled = [...unfilteredWords].sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, Math.min(screenCount, unfilteredWords.length))

    if (selectedWords.length === 0) {
      alert('没有可筛的单词了！所有单词都已筛选完成。')
      return
    }

    setScreenWords(selectedWords)
    setCurrentIndex(0)
    setKnownCount(0)
    setUnknownCount(0)
    setShowMeaning(false)
    setIsFinished(false)
    setShowSettings(false)
  }

  // 标记认识
  const markKnown = async () => {
    const word = screenWords[currentIndex]
    if (!word) return

    setKnownCount(prev => prev + 1)
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    setShowMeaning(false)

    // 更新数据库和状态
    try {
      await updateWord(word.id, { status: 'known' })
      // 同时更新本地 currentWords 状态，确保同步
      useAppStore.setState(state => ({
        currentWords: state.currentWords.map(w =>
          w.id === word.id ? { ...w, status: 'known' } : w
        )
      }))
    } catch (err) {
      console.error('更新单词状态失败:', err)
    }

    // 检查是否完成
    if (newIndex >= screenWords.length) {
      // 刷新词书数据
      if (wordbookId) {
        await selectWordbook(wordbookId)
      }
      // 筛词完成，自动跳转到学习页面
      navigate(`/study/${wordbookId}`)
    }
  }

  // 查看释义
  const toggleMeaning = () => {
    setShowMeaning(prev => !prev)
  }

  // 标记不认识
  const markUnknown = () => {
    setUnknownCount(prev => prev + 1)
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    setShowMeaning(false)

    // 不认识的词保持在生词本（status已经是unknown）
    // 检查是否完成
    if (newIndex >= screenWords.length) {
      // 刷新词书数据
      if (wordbookId) {
        selectWordbook(wordbookId)
      }
      // 筛词完成，自动跳转到学习页面
      navigate(`/study/${wordbookId}`)
    }
  }

  // 手势处理
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    touchEndY.current = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    const minSwipeDistance = 50
    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current

    // 确保是水平滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          markUnknown() // 右滑 = 不认识（继续留在生词本）
        } else {
          markKnown() // 左滑 = 认识（移出生词本）
        }
      }
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || isFinished) return

      if (e.code === 'Space') {
        e.preventDefault()
        toggleMeaning()
      } else if (e.code === 'ArrowLeft') {
        markKnown() // 左箭头 = 认识
      } else if (e.code === 'ArrowRight') {
        markUnknown() // 右箭头 = 不认识
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, isFinished, currentIndex])

  // 加载中
  if (loading) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600">正在加载...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">出错了</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // 获取可筛单词数量
  const unfilteredCount = currentWords.filter(w => w.status === 'unknown').length

  // 设置界面
  if (showSettings) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-slate-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">筛词设置</h2>
              <p className="text-slate-500">快速筛选认识和不认识的单词</p>
            </div>

            <div className="mb-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 bg-slate-50 rounded-2xl p-6">
                  <button
                    onClick={() => setScreenCount(Math.max(20, screenCount - 20))}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    -
                  </button>
                  <div className="text-center w-24">
                    <div className="text-4xl font-black text-slate-900">{screenCount}</div>
                    <div className="text-sm text-slate-500">单词/次</div>
                  </div>
                  <button
                    onClick={() => setScreenCount(Math.min(unfilteredCount, screenCount + 20))}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[50, 100, 150, 200].map(count => (
                  <button
                    key={count}
                    onClick={() => setScreenCount(count)}
                    disabled={count > unfilteredCount}
                    className={`py-3 rounded-xl text-sm font-medium transition-all
                      ${screenCount === count ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                      ${count > unfilteredCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-slate-500 mt-4">
                共有 <span className="font-bold text-purple-600">{unfilteredCount}</span> 个单词待筛选
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">筛词说明</span>
              </div>
              <p className="text-sm text-purple-600">
                • 左滑 = 不认识（保留在生词本）<br/>
                • 右滑 = 认识（移出生词本）<br/>
                • 快筛后生成个性化单词表
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/wordbook/${wordbookId}`)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                返回
              </button>
              <button
                onClick={startScreening}
                disabled={unfilteredCount === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始筛词
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // 完成界面
  if (isFinished) {
    const totalFiltered = knownCount + unknownCount

    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">筛词完成！</h2>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-black text-emerald-600">{knownCount}</p>
                  <p className="text-sm text-slate-500">认识的单词</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-red-600">{unknownCount}</p>
                  <p className="text-sm text-slate-500">不认识的单词</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  生词本剩余 <span className="font-bold text-purple-600">{unfilteredCount - unknownCount}</span> 个单词
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/wordbook/${wordbookId}`)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                返回词书
              </button>
              {unfilteredCount - unknownCount > 0 && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 px-4 py-3 bg-white border border-purple-200 text-purple-700 rounded-xl font-medium hover:bg-purple-50 transition-colors"
                >
                  继续筛词
                </button>
              )}
            </div>

            {/* 引导开始学习 */}
            {unfilteredCount - unknownCount > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">个性化生词本已生成</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    共有 <span className="font-bold text-purple-600">{unfilteredCount - unknownCount}</span> 个单词需要学习
                  </p>
                  <button
                    onClick={() => navigate(`/study/${wordbookId}`)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
                  >
                    开始学习
                  </button>
                </div>
              </div>
            )}

            {/* 全部筛选完成 */}
            {unfilteredCount - unknownCount === 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <h3 className="text-lg font-bold text-green-700 mb-2">恭喜！全部筛选完成</h3>
                  <p className="text-sm text-green-600 mb-4">
                    所有单词都已筛选完毕，可以开始学习了！
                  </p>
                  <button
                    onClick={() => navigate(`/study/${wordbookId}`)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                  >
                    开始学习
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    )
  }

  // 筛词界面
  const currentWord = screenWords[currentIndex]

  // 如果没有单词了
  if (!currentWord) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">没有可筛的单词</h2>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              返回设置
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div
        className="p-6 lg:ml-56"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-2xl mx-auto">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (confirm('确定要退出筛词吗？进度将不会保存。')) {
                  navigate(`/wordbook/${wordbookId}`)
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">
                {currentIndex + 1} / {screenWords.length}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-slate-200 rounded-full mb-12 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / screenWords.length) * 100}%` }}
            />
          </div>

          {/* 单词卡片 */}
          <WordCard
            word={currentWord}
            showMeaning={showMeaning}
            onShowMeaning={toggleMeaning}
            onKnown={markKnown}
            onUnknown={markUnknown}
          />

          {/* 操作按钮 */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <button
              onClick={markKnown}
              className="py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-emerald-600 hover:to-green-600 hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              认识
            </button>
            <button
              onClick={toggleMeaning}
              className="py-5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-yellow-600 hover:to-amber-600 hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Eye className="w-6 h-6" />
              查看释义
            </button>
            <button
              onClick={markUnknown}
              className="py-5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-red-600 hover:to-rose-600 hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <XCircle className="w-6 h-6" />
              不认识
            </button>
          </div>

          {/* 提示 */}
          <div className="mt-8 text-center text-sm text-slate-400">
            <p>💡 提示：左滑或按左箭头 = 认识，右滑或按右箭头 = 不认识</p>
            <p className="mt-1">按空格键可查看释义</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}