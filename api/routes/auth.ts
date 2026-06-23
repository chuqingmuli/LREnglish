/**
 * 用户认证API路由
 * 处理用户注册、登录、登出等
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/index.js'

const router = Router()

// JWT密钥（生产环境应该从环境变量中获取）
const JWT_SECRET = process.env.JWT_SECRET || 'zuoyouyingyu-secret-key-2024'

// JWT token有效期
const JWT_EXPIRES_IN = '7d'

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body

    // 验证必填字段
    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '用户名、邮箱和密码都是必填项' })
      return
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ success: false, error: '用户名长度必须在3-20个字符之间' })
      return
    }

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({ success: false, error: '密码长度至少6个字符' })
      return
    }

    // 检查用户名是否已存在
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUsername) {
      res.status(400).json({ success: false, error: '用户名已被使用' })
      return
    }

    // 检查邮箱是否已存在
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existingEmail) {
      res.status(400).json({ success: false, error: '邮箱已被注册' })
      return
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 创建用户
    const userId = crypto.randomUUID()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, username, email, passwordHash, now, now)

    // 生成JWT token
    const token = jwt.sign(
      { userId, username, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // 返回用户信息和token
    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          username,
          email,
          createdAt: now,
        },
        token,
      },
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    // 验证必填字段
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码都是必填项' })
      return
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ?
    `).get(username, username) as any

    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: '密码错误' })
      return
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // 返回用户信息和token
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        },
        token,
      },
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // JWT token在客户端删除即可，服务器端不需要特殊处理
  res.json({ success: true, message: '登出成功' })
})

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未提供认证token' })
      return
    }

    const token = authHeader.substring(7)

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any

    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }

    // 返回用户信息
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(401).json({ success: false, error: '认证失败' })
  }
})

/**
 * 验证token中间件（供其他路由使用）
 */
export function authMiddleware(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未提供认证token' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    }

    next()
  } catch (error) {
    res.status(401).json({ success: false, error: '认证失败' })
  }
}

export default router