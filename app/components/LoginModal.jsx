'use client';

import { useMemo, useState } from 'react';
import { LoginIcon, UserIcon } from './Icons';

/**
 * 登录/注册弹窗（用户名 + 密码）
 *
 * 说明：
 * - 系统要求“强制登录”，因此这个弹窗会在未登录时阻塞主界面。
 * - 注册仅在没有账号时使用。
 */
export default function LoginModal({
  onClose,
  mode,
  setMode,
  form,
  setForm,
  loading,
  error,
  onSubmit,
}) {
  const isLogin = mode === 'login';
  const title = useMemo(() => (isLogin ? '账号登录' : '注册账号'), [isLogin]);

  const [showPwd, setShowPwd] = useState(false);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="glass card modal login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="title" style={{ marginBottom: 16 }}>
          {isLogin ? <LoginIcon width="20" height="20" /> : <UserIcon width="20" height="20" />}
          <span>{title}</span>
          <span className="muted">{isLogin ? '使用用户名+密码登录' : '创建新账号'}</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>用户名</div>
            <input
              style={{ width: '100%' }}
              className="input"
              type="text"
              placeholder="请输入用户名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 12 }}>
              <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>昵称（可选）</div>
              <input
                style={{ width: '100%' }}
                className="input"
                type="text"
                placeholder="给自己取个昵称"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>密码</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ width: '100%' }}
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="请输入密码"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowPwd((v) => !v)}
                disabled={loading}
                style={{ padding: '0 12px' }}
              >
                {showPwd ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-message error" style={{ marginBottom: 12 }}>
              <span>{error}</span>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setMode(isLogin ? 'register' : 'login')}
              disabled={loading}
            >
              {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="button secondary" onClick={onClose} disabled={loading}>
                取消
              </button>
              <button className="button" type="submit" disabled={loading || !form.username || !form.password}>
                {loading ? '处理中...' : isLogin ? '登录' : '注册'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
