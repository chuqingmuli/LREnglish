import { useEffect, useState, useRef } from 'react'
import { Mail, ChevronLeft, ChevronRight, Filter, Brain, CheckCircle2, Target, Plus, PlayCircle, BookOpen, RotateCcw, Check, LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store'
import { WordBookCard } from '../components/WordBookCard'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import type { WordBook } from '../../shared/types'

// 引导步骤
type SetupStep = 'select-wordbook' | 'set-goal' | 'done'

export function Home() {
  const navigate = useNavigate()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().getDate())
  const [tempGoal, setTempGoal] = useState(30)
  
  // 设置引导状态
  const [setupStep, setSetupStep] = useState<SetupStep>('select-wordbook')
  const [selectedWordbook, setSelectedWordbook] = useState<WordBook | null>(null)

  const {
    wordbooks, loading, error, currentWordbook, dailyGoal, currentWords,
    fetchWordbooks, createWordbook, deleteWordbook, selectWordbook, setDailyGoal, setHasSetup,
    fetchDailyStats, hasSetup, dailyStats, isAuthenticated, checkAuth, user, logout,
  } = useAppStore()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 计算真实的学习进度（限制最大100%）
  const wordsLearned = dailyStats?.wordsLearned || 0
  const progressPercent = dailyGoal > 0 ? Math.min(Math.round((wordsLearned / dailyGoal) * 100), 100) : 0
  const progressWidth = `${progressPercent}%`

  // 词书已学单词数（已掌握+学习中+已认识）
  const wordbookLearned = currentWords.filter(w => w.status === 'mastered' || w.status === 'learning' || w.status === 'known').length
  const wordbookProgressPercent = currentWords.length > 0 ? Math.min(Math.round((wordbookLearned / currentWords.length) * 100), 100) : 0
  const wordbookProgressWidth = `${wordbookProgressPercent}%`

  useEffect(() => {
    // 检查认证状态
    checkAuth()
  }, [])

  useEffect(() => {
    // 如果已认证，加载数据
    if (isAuthenticated) {
      fetchWordbooks()
      fetchDailyStats()
    }
  }, [isAuthenticated])

  // 如果未认证，跳转到登录页面
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login')
    }
  }, [isAuthenticated, loading])

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // 定期刷新每日统计
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDailyStats()
    }, 5000) // 每5秒刷新一次

    return () => clearInterval(interval)
  }, [])

  // 当currentWordbook变化时，加载该词书的单词
  useEffect(() => {
    if (currentWordbook && currentWords.length === 0) {
      selectWordbook(currentWordbook.id)
    }
  }, [currentWordbook])

  // 判断是否需要显示引导
  const needsSetup = !hasSetup || !currentWordbook

  const handleCreateWordbook = async () => {
    if (!newName.trim()) return
    await createWordbook(newName.trim(), newDescription.trim())
    setShowNewModal(false)
    setNewName('')
    setNewDescription('')
  }

  const handleDeleteWordbook = async (id: string) => {
    if (confirm('确定要删除这个词书吗？此操作不可撤销。')) {
      await deleteWordbook(id)
    }
  }

  const handleSelectWordbook = async (wordbook: WordBook) => {
    await selectWordbook(wordbook.id)
    setSelectedWordbook(wordbook)
    setSetupStep('set-goal')
  }

  const handleCompleteSetup = async () => {
    setDailyGoal(tempGoal)
    setHasSetup(true)
    setSetupStep('done')
  }

  const builtinWordbooks = wordbooks.filter(w => w.type === 'built-in' || w.type === 'system')
  const customWordbooks = wordbooks.filter(w => w.type === 'custom')

  const today = new Date()
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
  
  // 引导界面
  if (needsSetup) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="max-w-2xl w-full">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                {(['select-wordbook', 'set-goal', 'done'] as const).map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${setupStep === step ? 'bg-blue-600 text-white scale-110' : 
                        (idx < ['select-wordbook', 'set-goal', 'done'].indexOf(setupStep) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500')}`}>
                      {idx < ['select-wordbook', 'set-goal', 'done'].indexOf(setupStep) ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-sm hidden sm:block
                      ${setupStep === step ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                      {step === 'select-wordbook' ? '选择词书' : step === 'set-goal' ? '设定目标' : '完成'}
                    </span>
                    {idx < 2 && (
                      <div className={`w-8 h-0.5
                        ${idx < ['select-wordbook', 'set-goal', 'done'].indexOf(setupStep) ? 'bg-green-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 步骤1：选择词书 */}
            {setupStep === 'select-wordbook' && (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">选择你的词书</h2>
                  <p className="text-slate-500">选择一本词书开始你的学习之旅</p>
                </div>

                <div className="space-y-4 mb-8">
                  {builtinWordbooks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">推荐词书</h3>
                      <div className="grid gap-3">
                        {builtinWordbooks.map(wb => (
                          <div
                            key={wb.id}
                            onClick={() => handleSelectWordbook(wb)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md
                              ${selectedWordbook?.id === wb.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {wb.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{wb.name}</h4>
                                <p className="text-sm text-slate-500">{wb.wordCount || 0} 个单词</p>
                              </div>
                              {selectedWordbook?.id === wb.id && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customWordbooks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">我的词书</h3>
                      <div className="grid gap-3">
                        {customWordbooks.map(wb => (
                          <div
                            key={wb.id}
                            onClick={() => handleSelectWordbook(wb)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md
                              ${selectedWordbook?.id === wb.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {wb.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{wb.name}</h4>
                                <p className="text-sm text-slate-500">{wb.wordCount || 0} 个单词</p>
                              </div>
                              {selectedWordbook?.id === wb.id && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    创建新词书
                  </button>
                  {selectedWordbook && (
                    <button
                      onClick={() => setSetupStep('set-goal')}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      下一步
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 步骤2：设定目标 */}
            {setupStep === 'set-goal' && (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">设定每日目标</h2>
                  <p className="text-slate-500">每天学习多少个单词？</p>
                </div>

                <div className="mb-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-3 bg-slate-50 rounded-2xl p-6">
                      <button
                        onClick={() => setTempGoal(Math.max(5, tempGoal - 5))}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        -
                      </button>
                      <div className="text-center w-24">
                        <div className="text-4xl font-black text-slate-900">{tempGoal}</div>
                        <div className="text-sm text-slate-500">单词/天</div>
                      </div>
                      <button
                        onClick={() => setTempGoal(Math.min(200, tempGoal + 5))}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[10, 20, 30, 50].map(count => (
                      <button
                        key={count}
                        onClick={() => setTempGoal(count)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all
                          ${tempGoal === count ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-8">
                  <p className="text-sm text-blue-700">
                    💡 提示：初学者建议每天20-30个单词，有基础可以挑战更多！
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep('select-wordbook')}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleCompleteSetup}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
                  >
                    开始学习！
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 新建词书弹窗 */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">新建词书</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">词书名称</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入词书名称"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">描述（可选）</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="输入词书描述"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateWordbook}
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    )
  }

  // 正常首页
  return (
    <Layout>
      <div className="p-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">首页</h2>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Mail className="w-4 h-4 text-slate-500" />
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || '用'}
                </div>
                <span className="text-sm text-slate-700">{user?.username || '用户'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout()
                      navigate('/login')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Today's Plan Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-blue-200 mb-2">今日学习计划</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black">{dailyGoal}</span>
                    <span className="text-sm text-blue-200">/ {dailyGoal} 个单词</span>
                  </div>
                  <p className="text-xs text-blue-200 mb-4">已完成 {progressPercent}%</p>
                  <div className="w-full max-w-md h-1.5 bg-blue-400/30 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: progressWidth }} />
                  </div>
                  {currentWordbook && (
                    <div className="space-y-3">
                      {/* 生词本状态 */}
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm text-blue-200 mb-1">生词本剩余</p>
                        <p className="text-lg font-bold">
                          <span className="text-white">{currentWords.filter(w => w.status === 'unknown').length}</span>
                          <span className="text-sm text-blue-200"> / {currentWords.length} 个单词</span>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => navigate(`/screen/${currentWordbook.id}`)}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                        >
                          <Filter className="w-4 h-4" />
                          开始筛词
                        </button>
                        <button
                          onClick={() => navigate(`/study/${currentWordbook.id}`)}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                          开始学习
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="w-24 h-28 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-16 h-20 bg-white rounded-lg shadow-xl transform rotate-[-5deg] flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-blue-600 font-bold text-xs">Left</span>
                          <br />
                          <span className="text-blue-600 font-bold text-xs">Right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Wordbook */}
            {currentWordbook && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">当前词书</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{currentWordbook.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">单词数量：{currentWords.length}</p>
                    <p className="text-xs text-slate-500 mb-2">已学单词：{wordbookLearned}（{wordbookProgressPercent}%）</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: wordbookProgressWidth }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/wordbook/${currentWordbook.id}`)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      查看词书
                    </button>
                    <button
                      onClick={() => navigate('/wordbooks')}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      更换
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wordbooks Section */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">我的词书</h3>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  新建词书
                </button>
              </div>

              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg text-xs text-red-600">{error}</div>
              )}

              {builtinWordbooks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">推荐词书</p>
                  <div className="grid grid-cols-2 gap-3">
                    {builtinWordbooks.slice(0, 4).map(wb => (
                      <WordBookCard
                        key={wb.id}
                        wordbook={wb}
                        onClick={() => navigate(`/wordbook/${wb.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {customWordbooks.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">我的词书</p>
                  <div className="grid grid-cols-2 gap-3">
                    {customWordbooks.map(wb => (
                      <WordBookCard
                        key={wb.id}
                        wordbook={wb}
                        onClick={() => navigate(`/wordbook/${wb.id}`)}
                        onDelete={() => handleDeleteWordbook(wb.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-5">
            {/* Today's Data */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4">今日数据</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">学习时长</p>
                      <p className="text-lg font-black text-slate-900">0分钟</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">学习单词</p>
                      <p className="text-lg font-black text-slate-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">正确率</p>
                      <p className="text-lg font-black text-slate-900">0%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Calendar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">学习日历</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (currentMonth === 1) {
                        setCurrentMonth(12)
                        setCurrentYear(currentYear - 1)
                      } else {
                        setCurrentMonth(currentMonth - 1)
                      }
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <ChevronLeft className="w-3 h-3 text-slate-400" />
                  </button>
                  <span className="text-xs text-slate-600 px-2">{currentYear}年{monthNames[currentMonth - 1]}</span>
                  <button
                    onClick={() => {
                      if (currentMonth === 12) {
                        setCurrentMonth(1)
                        setCurrentYear(currentYear + 1)
                      } else {
                        setCurrentMonth(currentMonth + 1)
                      }
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[10px] text-slate-500 py-1">{day}</div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, idx) => {
                  const dayNum = idx - firstDay + 1
                  const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
                  return (
                    <button
                      key={idx}
                      className={`aspect-square text-[11px] rounded-lg flex items-center justify-center transition-colors
                        ${isCurrentMonth && dayNum === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
                          : isCurrentMonth
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300'
                        }`}
                    >
                      {isCurrentMonth ? dayNum : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mastery Progress */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4">掌握进度</h3>
              <div className="flex items-center gap-4">
                {/* Circular Progress */}
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="32" stroke="#3b82f6" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="201" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-slate-900">0%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-slate-600">已掌握</span>
                    </div>
                    <span className="text-[11px] text-slate-700">0（0%）</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[11px] text-slate-600">学习中</span>
                    </div>
                    <span className="text-[11px] text-slate-700">0（0%）</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <span className="text-[11px] text-slate-600">未学习</span>
                    </div>
                    <span className="text-[11px] text-slate-700">{wordbooks.reduce((sum, wb) => sum + (wb.wordCount || 0), 0)}（100%）</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Wordbook Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">新建词书</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">词书名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入词书名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述（可选）</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="输入词书描述"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateWordbook}
                disabled={!newName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
