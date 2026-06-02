import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, PlayCircle, BookOpen, BarChart3, RotateCcw, Bookmark, Settings } from 'lucide-react'
import { useAppStore } from '../store'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentWordbook } = useAppStore()

  const navItems = [
    { id: 'home', label: '首页', icon: Home, path: '/' },
    { id: 'start', label: '开始学习', icon: PlayCircle },
    { id: 'books', label: '词书管理', icon: BookOpen, path: '/wordbooks' },
    { id: 'stats', label: '学习统计', icon: BarChart3, path: '/stats' },
    { id: 'review', label: '复习记录', icon: RotateCcw, path: '/review' },
    { id: 'words', label: '生词本', icon: Bookmark, path: '/words' },
    { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
  ]

  const handleNavClick = (item: any) => {
    if (item.id === 'start') {
      if (currentWordbook) {
        navigate(`/study/${currentWordbook.id}`)
      } else {
        navigate('/wordbooks')
      }
    } else {
      navigate(item.path)
    }
  }

  const getActiveId = () => {
    if (location.pathname === '/') return 'home'
    if (location.pathname.startsWith('/wordbook')) return 'books'
    if (location.pathname.startsWith('/study')) return 'start'
    for (const item of navItems) {
      if (location.pathname.startsWith(item.path)) return item.id
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* 装饰外圈 */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md -z-10 scale-110"></div>
              {/* Logo主体 */}
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 relative overflow-hidden group">
                {/* 光效 */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                {/* 文字 */}
                <div className="text-white font-black text-sm tracking-wider relative z-10 transform group-hover:scale-110 transition-transform duration-200">LR</div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">左右英语</h1>
              <p className="text-xs text-slate-500 font-medium">LeftRight English</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = getActiveId() === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Upgrade Card */}
        <div className="p-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500">👑</span>
              <span className="text-xs font-bold text-slate-800">升级专业版</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">解锁更多功能</p>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              立即升级
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 min-h-screen flex-1">
        {children}
      </main>
    </div>
  )
}
