import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { Layout } from '../components/Layout'
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAppStore()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (mode === 'login') {
      if (!username || !password) {
        setLocalError('请输入用户名和密码')
        return
      }
      const success = await login(username, password)
      if (success) {
        navigate('/')
      }
    } else {
      if (!username || !email || !password) {
        setLocalError('请填写所有字段')
        return
      }
      if (username.length < 3) {
        setLocalError('用户名至少3个字符')
        return
      }
      if (password.length < 6) {
        setLocalError('密码至少6个字符')
        return
      }
      const success = await login(username, password, email)
      if (success) {
        navigate('/')
      }
    }
  }

  return (
    <Layout>
      <div className="p-6 lg:ml-56 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-slate-100">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 p-2 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {mode === 'login' ? (
                <LogIn className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {mode === 'login' ? '登录' : '注册'}
            </h2>
            <p className="text-slate-500">
              {mode === 'login' ? '登录到左右英语' : '创建新账号'}
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入用户名"
                />
              </div>
            </div>

            {/* 邮箱（仅注册时显示） */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入邮箱"
                  />
                </div>
              </div>
            )}

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入密码"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {(localError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {localError || error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          {/* 切换模式 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setLocalError(null)
                }}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login' ? '注册' : '登录'}
              </button>
            </p>
          </div>

          {/* 说明 */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              登录后可以保存您的学习记录和词书
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}