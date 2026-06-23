import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { WordCard } from '../components/WordCard'
import { ArrowLeft, CheckCircle2, XCircle, Eye } from 'lucide-react'

export function Study() {
  const { id: wordbookId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // 获取store中的状态和函数
  const {
    currentWordbook,
    dailyGoal,
    studyPhase,
    todayWords,
    currentWordIndex,
    knownWords,
    unknownWords,
    showMeaning,
    selectWordbook,
    startNewStudySession,
    proceedToPractice,
    markWordKnown,
    markWordUnknown,
    toggleMeaning,
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 手势相关状态
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (studyPhase === 'practice') {
        if (e.code === 'Space') {
          e.preventDefault()
          toggleMeaning()
        } else if (e.code === 'ArrowLeft') {
          markWordKnown() // 左箭头 = 认识
        } else if (e.code === 'ArrowRight') {
          markWordUnknown() // 右箭头 = 不认识
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyPhase, toggleMeaning, markWordKnown, markWordUnknown])

  // 手势处理函数
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
    if (studyPhase !== 'practice') return

    const minSwipeDistance = 50
    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current

    // 确保是水平滑动而不是垂直滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          markWordUnknown() // 右滑 = 不认识
        } else {
          markWordKnown() // 左滑 = 认识
        }
      }
    }
  }

  // 初始化学习会话
  const initStudySession = async () => {
    console.log('[Study] 开始初始化...')
    console.log('[Study] wordbookId:', wordbookId)
    console.log('[Study] studyPhase:', studyPhase)
    console.log('[Study] todayWords.length:', todayWords.length)
    try {
      if (wordbookId) {
        // 直接启动学习会话，startNewStudySession 会获取最新数据
        if (studyPhase === 'selection' || todayWords.length === 0) {
          await startNewStudySession(wordbookId)
          console.log('[Study] startNewStudySession 完成')
          const state = useAppStore.getState()
          console.log('[Study] 初始化后 todayWords.length:', state.todayWords.length)
          console.log('[Study] dailyGoal:', state.dailyGoal)
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('[Study] 初始化出错:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setLoading(false)
    }
  }

  useEffect(() => {
    initStudySession()
  }, [wordbookId])

  // 阶段2：记忆阶段（显示完整单词表）
  const renderMemoryPhase = () => (
    <div className="p-6 lg:ml-56">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">记忆单词</h1>
            <p className="text-sm text-slate-500">共 {todayWords.length} 个单词</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {todayWords.map((word, index) => (
              <div key={word.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-slate-900">{word.word}</h3>
                      {word.phonetic && (
                        <span className="text-base text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                          {word.phonetic}
                        </span>
                      )}
                    </div>
                    
                    {word.meaningEn && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">English</h4>
                        <p className="text-slate-700">{word.meaningEn}</p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">中文释义</h4>
                      <p className="text-slate-700">{word.meaningCn || word.meaning}</p>
                    </div>
                    
                    {word.example && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">例句</h4>
                        <p className="text-sm text-slate-500 italic border-l-2 border-emerald-300 pl-4 py-1 bg-emerald-50/50 rounded-r-lg">
                          {word.example}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={proceedToPractice}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl text-base font-medium transition-all"
        >
          进入练习模式
        </button>
      </div>
    </div>
  )

  // 阶段3：练习阶段
  const renderPracticePhase = () => {
    const currentWord = todayWords[currentWordIndex]
    const isFinished = currentWordIndex >= todayWords.length

    if (isFinished) {
      // 第一轮完成，检查是否有不认识的单词
      if (unknownWords.length > 0) {
        // 有不认识的单词，进入第二轮学习
        return (
          <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">第一轮完成！</h2>
              <div className="text-slate-500 mb-6">
                <p>认识的单词：{knownWords.length}</p>
                <p>不认识的单词：{unknownWords.length}</p>
                <p className="text-sm text-slate-400 mt-2">不认识的单词需要再学习一遍</p>
              </div>
              <button
                onClick={async () => {
                  // 将不认识的单词重新设置为今日单词，进入第二轮
                  // 更新每日统计
                  const learnedCount = knownWords.length
                  const { updateDailyStats, selectWordbook } = useAppStore.getState()
                  const currentStats = useAppStore.getState().dailyStats
                  await updateDailyStats({
                    wordsLearned: (currentStats?.wordsLearned || 0) + learnedCount,
                    completed: false,
                  })

                  // 重新加载词书数据
                  if (wordbookId) {
                    await selectWordbook(wordbookId)
                  }

                  useAppStore.setState({
                    todayWords: unknownWords,
                    currentWordIndex: 0,
                    knownWords: [],
                    unknownWords: [],
                    showMeaning: false,
                  })
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-base font-medium transition-all"
              >
                进入第二轮学习
              </button>
            </div>
          </div>
        )
      } else {
        // 全部认识，学习完成
        return (
          <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">今日学习完成！</h2>
              <div className="text-slate-500 mb-8">
                <p>全部掌握！共学习了 {todayWords.length} 个单词</p>
              </div>
              <button
                onClick={async () => {
                  // 更新每日统计为完成
                  const learnedCount = knownWords.length + unknownWords.length
                  const { updateDailyStats } = useAppStore.getState()
                  const currentStats = useAppStore.getState().dailyStats
                  await updateDailyStats({
                    wordsLearned: (currentStats?.wordsLearned || 0) + learnedCount,
                    completed: true,
                  })

                  // 重新加载词书数据，确保首页统计更新
                  if (wordbookId) {
                    const { selectWordbook } = useAppStore.getState()
                    await selectWordbook(wordbookId)
                  }

                  navigate('/')
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-base font-medium transition-all"
              >
                返回首页
              </button>
            </div>
          </div>
        )
      }
    }

    return (
      <div className="p-6 lg:ml-56">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                {currentWordIndex + 1} / {todayWords.length}
              </span>
            </div>
          </div>

          <WordCard
            word={currentWord}
            showMeaning={showMeaning}
            onShowMeaning={toggleMeaning}
            onKnown={markWordKnown}
            onUnknown={markWordUnknown}
          />
          
          <div className="mt-12 grid grid-cols-3 gap-4">
            <button
              onClick={markWordKnown}
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
              onClick={markWordUnknown}
              className="py-5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-red-600 hover:to-rose-600 hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <XCircle className="w-6 h-6" />
              不认识
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600">正在加载...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">出错了</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              返回首页
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {studyPhase === 'memory' && renderMemoryPhase()}
      {studyPhase === 'practice' && renderPracticePhase()}
    </Layout>
  )
}
