import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Icon } from '@astryxdesign/core/Icon'
import { Brand, InlineError } from '../../components'
import './index.css'

export const LoginPage = (): React.JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  return (
    <main className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <h1>
            读懂保险，
            <br />
            从这里开始。
          </h1>
          <p>
            把复杂的条款放回具体的问题里，
            <br />
            让每个回答都有可以核对的出处。
          </p>
        </div>
      </div>
      <div className="login-form-region">
        <form
          className="login-form"
          onSubmit={event => {
            event.preventDefault()
            setError('认证服务尚未接入，当前无法登录。你可以先预览工作台。')
          }}>
          <h2>登录钩玄</h2>
          <p className="login-introduction">使用管理员为你开通的账号。</p>
          <TextInput
            label="邮箱"
            type="email"
            htmlName="email"
            value={email}
            onChange={value => {
              setEmail(value)
              setError('')
            }}
            placeholder="name@example.com"
            autoComplete="username"
            isRequired
          />
          <div className="password-field">
            <TextInput
              label="密码"
              type={isPasswordVisible ? 'text' : 'password'}
              htmlName="password"
              value={password}
              onChange={value => {
                setPassword(value)
                setError('')
              }}
              placeholder="输入密码"
              autoComplete="current-password"
              isRequired
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
              aria-pressed={isPasswordVisible}
              onClick={() => setIsPasswordVisible(current => !current)}>
              {isPasswordVisible ? '隐藏' : '显示'}
            </button>
          </div>
          {error && <InlineError>{error}</InlineError>}
          <Button
            label="登录"
            variant="primary"
            type="submit"
            width="100%"
            size="lg"
            isDisabled={!email.trim() || !password}
          />
          <div className="login-help">
            <Icon icon="info" size="sm" />
            <span>开通账号或重置密码，请联系管理员。</span>
          </div>
          <div className="login-preview">
            <Link to="/chat">
              先看看工作台 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
LoginPage.displayName = 'LoginPage'
