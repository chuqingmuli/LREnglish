import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useAppStore } from '../store'
import { User, Mail, Lock, Calendar, CheckCircle2, XCircle, Settings as SettingsIcon, Shield, Bell, Palette } from 'lucide-react'

export function Settings() {
  const { user, dailyGoal, setDailyGoal, changePassword, updateProfile, error, clearError } = useAppStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile')

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [preferencesForm, setPreferencesForm] = useState({
    dailyGoal: String(dailyGoal),
  })

  // 同步 store 中的 dailyGoal 变化到本地表单
  useEffect(() => {
    setPreferencesForm(prev => ({ ...prev, dailyGoal: String(dailyGoal) }))
  }, [dailyGoal])

  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await updateProfile({ username: profileForm.username, email: profileForm.email })
    if (result) {
      setSubmitStatus('success')
      setSubmitMessage('用户信息更新成功')
    } else {
      setSubmitStatus('error')
      setSubmitMessage(error || '更新失败')
    }
    setTimeout(() => {
      setSubmitStatus(null)
      setSubmitMessage('')
      clearError()
    }, 3000)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSubmitStatus('error')
      setSubmitMessage('两次输入的密码不一致')
      setTimeout(() => {
        setSubmitStatus(null)
        setSubmitMessage('')
      }, 3000)
      return
    }
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    if (result) {
      setSubmitStatus('success')
      setSubmitMessage('密码修改成功')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      setSubmitStatus('error')
      setSubmitMessage(error || '修改失败')
    }
    setTimeout(() => {
      setSubmitStatus(null)
      setSubmitMessage('')
      clearError()
    }, 3000)
  }

  const handlePreferencesSubmit = () => {
    const num = parseInt(preferencesForm.dailyGoal)
    if (isNaN(num) || num < 1 || num > 200) {
      setSubmitStatus('error')
      setSubmitMessage('每日目标必须在1-200之间')
      setTimeout(() => {
        setSubmitStatus(null)
        setSubmitMessage('')
      }, 3000)
      return
    }
    setDailyGoal(num)
    setSubmitStatus('success')
    setSubmitMessage('设置已保存')
    setTimeout(() => {
      setSubmitStatus(null)
      setSubmitMessage('')
    }, 3000)
  }

  const tabs = [
    { id: 'profile', label: '个人信息', icon: User },
    { id: 'password', label: '修改密码', icon: Lock },
    { id: 'preferences', label: '学习偏好', icon: SettingsIcon },
  ] as const

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">个人设置</h2>
        </div>

        {submitStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            submitStatus === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {submitStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="text-sm">{submitMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{user?.username}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <User className="w-4 h-4" />
                    用户名
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入用户名"
                  />
                  <p className="text-xs text-slate-400 mt-1">用户名长度必须在3-20个字符之间</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="w-4 h-4" />
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入邮箱"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  注册时间：{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-' }
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  保存更改
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800">安全提示</h4>
                      <p className="text-xs text-blue-600 mt-1">请确保新密码强度足够，建议使用字母、数字和特殊字符的组合。</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <Lock className="w-4 h-4" />
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入当前密码"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <Lock className="w-4 h-4" />
                    新密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入新密码"
                  />
                  <p className="text-xs text-slate-400 mt-1">密码长度至少6个字符</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <Lock className="w-4 h-4" />
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="再次输入新密码"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  修改密码
                </button>
              </form>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 block text-sm font-medium text-slate-700 mb-2">
                    <SettingsIcon className="w-4 h-4" />
                    每日学习目标
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={preferencesForm.dailyGoal}
                      onChange={(e) => {
                        // 直接存字符串，删掉就是空，不会在前面补0
                        setPreferencesForm({ ...preferencesForm, dailyGoal: e.target.value })
                      }}
                      min="1"
                      max="200"
                      className="w-32 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-slate-500">个单词/天</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">建议每天学习20-50个单词，效果最佳</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-4">提醒设置</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                      <Bell className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">学习提醒</span>
                      <div className="ml-auto w-10 h-6 bg-slate-300 rounded-full" />
                    </label>
                    <p className="text-xs text-slate-400">提醒功能即将上线，敬请期待</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-4">外观设置</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer">
                      <Palette className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-slate-700">默认主题</span>
                      <div className="ml-auto w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600" />
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                      <Palette className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">深色模式</span>
                      <div className="ml-auto w-4 h-4 bg-slate-300 rounded-full" />
                    </label>
                    <p className="text-xs text-slate-400">外观设置即将上线，敬请期待</p>
                  </div>
                </div>

                <button
                  onClick={handlePreferencesSubmit}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  保存设置
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}