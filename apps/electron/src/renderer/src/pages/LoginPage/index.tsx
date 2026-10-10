import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { VStack } from '@astryxdesign/core/VStack'
import {
  ArrowRightIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from '@radix-ui/react-icons'
import { InlineError } from '../../components'
import { LoginLogo } from './components'
import './index.css'

export const LoginPage = (): React.JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  return (
    <main className="login-page">
      <VStack className="login-content" gap={8} width="100%" maxWidth={360}>
        <VStack as="header" className="login-identity" hAlign="center" gap={5}>
          <LoginLogo />
          <VStack hAlign="center" gap={2}>
            <h1 id="login-title">登录钩玄</h1>
            <p>读懂保险，从一个问题开始。</p>
          </VStack>
        </VStack>
        <VStack
          as="form"
          className="login-form"
          gap={5}
          aria-labelledby="login-title"
          onSubmit={event => {
            event.preventDefault()
            if (!email.trim() || !password) return
            setError(
              import.meta.env.DEV
                ? '认证服务尚未接入，请先预览工作台。'
                : '认证服务尚未接入，暂时无法登录。'
            )
          }}>
          <TextInput
            label="邮箱"
            type="email"
            htmlName="email"
            value={email}
            onChange={value => {
              setEmail(value)
              setError('')
            }}
            placeholder="输入邮箱地址"
            autoComplete="username"
            size="lg"
          />
          <VStack className="login-password-field">
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
              size="lg"
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
              aria-pressed={isPasswordVisible}
              onClick={() => setIsPasswordVisible(current => !current)}>
              {isPasswordVisible ? (
                <EyeClosedIcon aria-hidden="true" />
              ) : (
                <EyeOpenIcon aria-hidden="true" />
              )}
            </button>
          </VStack>
          <Button
            label="登录"
            variant="primary"
            type="submit"
            width="100%"
            size="lg"
            isDisabled={!email.trim() || !password}
          />
          <VStack className="login-feedback" hAlign="center" vAlign="center">
            {error ? (
              <InlineError>{error}</InlineError>
            ) : (
              <p>账号开通与密码重置，请联系管理员。</p>
            )}
          </VStack>
        </VStack>
        {import.meta.env.DEV && (
          <Link className="login-preview" to="/chat">
            先看看工作台
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        )}
      </VStack>
    </main>
  )
}
LoginPage.displayName = 'LoginPage'
