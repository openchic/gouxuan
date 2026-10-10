import { Link } from '@tanstack/react-router'
import { Icon } from '@astryxdesign/core/Icon'
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl'
import { InlineError } from '../../components'
import { isThemePreference } from '../../../../shared/ipc'
import { useWorkspace } from '../../hooks'
import './index.css'

export const SettingsPage = (): React.JSX.Element => {
  const { theme, changeTheme, isSavingTheme, themeError } = useWorkspace()
  return (
    <div className="general-settings">
      <header className="settings-page-header">
        <h1>通用设置</h1>
      </header>
      <section className="settings-section">
        <div className="settings-section-title">
          <h2>外观</h2>
        </div>
        <div className="appearance-row">
          <div>
            <h3>主题模式</h3>
            <p>跟随系统自动切换，偏好保存在本机。</p>
          </div>
          <SegmentedControl
            label="主题模式"
            value={theme}
            isDisabled={isSavingTheme}
            onChange={value => {
              if (isThemePreference(value)) void changeTheme(value)
            }}>
            <SegmentedControlItem value="light" label="浅色" />
            <SegmentedControlItem value="dark" label="深色" />
            <SegmentedControlItem value="system" label="跟随系统" />
          </SegmentedControl>
        </div>
        <p className="setting-caption" role="status">
          {isSavingTheme ? '正在保存…' : ''}
        </p>
        {themeError && <InlineError>{themeError}</InlineError>}
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <h2>账号</h2>
        </div>
        <div className="setting-row">
          <div className="setting-account">
            <span className="setting-avatar">访</span>
            <div>
              <h3>尚未登录</h3>
              <p>登录后使用个人会话。</p>
            </div>
          </div>
          <Link className="settings-login-link" to="/login">
            前往登录 <Icon icon="chevronRight" size="sm" />
          </Link>
        </div>
      </section>
      <section className="settings-section settings-about-section">
        <div className="setting-row">
          <div>
            <h3>钩玄桌面客户端</h3>
            <p>v0.1.0</p>
          </div>
        </div>
      </section>
    </div>
  )
}
SettingsPage.displayName = 'SettingsPage'
