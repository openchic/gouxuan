import { useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { TextInput } from '@astryxdesign/core/TextInput'
import { GearIcon, PlusIcon } from '@radix-ui/react-icons'
import { WorkspaceSideNav } from '../WorkspaceSideNav'
import { useWorkspace } from '../../hooks'
import { previewConversations } from '../../data/preview-conversations'
import './index.css'

export const AppShell = (): React.JSX.Element => {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const navigate = useNavigate()
  const { theme } = useWorkspace()
  const [search, setSearch] = useState('')
  const isLogin = pathname === '/login'
  const isSettings = pathname.startsWith('/settings')
  const conversations = previewConversations.filter(item =>
    item.title.includes(search.trim())
  )

  return (
    <Theme theme={neutralTheme} mode={theme}>
      <div className="app-shell" data-platform={window.desktop.platform}>
        {isLogin || isSettings ? (
          <Outlet />
        ) : (
          <div className="chat-workspace">
            <WorkspaceSideNav
              topContent={
                <div className="sidebar-tools">
                  <Button
                    label="新建会话"
                    variant="primary"
                    width="100%"
                    icon={<PlusIcon width="1em" height="1em" aria-hidden />}
                    onClick={() => navigate({ to: '/chat' })}
                  />
                  <TextInput
                    label="搜索会话"
                    isLabelHidden
                    value={search}
                    onChange={setSearch}
                    placeholder="搜索会话"
                    startIcon={<Icon icon="search" size="sm" />}
                    hasClear
                    size="sm"
                  />
                </div>
              }
              footerIcons={
                <div className="sidebar-footer">
                  <Button
                    label="登录"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/login' })}
                  />
                  <Button
                    label="设置"
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    icon={<GearIcon width="1em" height="1em" aria-hidden />}
                    tooltip="设置"
                    onClick={() => navigate({ to: '/settings' })}
                  />
                </div>
              }>
              {(['今天', '昨天'] as const).map(group => {
                const items = conversations.filter(item => item.group === group)
                return (
                  items.length > 0 && (
                    <SideNavSection title={`${group} · 示例`} key={group}>
                      {items.map(item => (
                        <SideNavItem
                          key={item.id}
                          label={item.title}
                          isSelected={pathname === `/chat/${item.id}`}
                          onClick={() =>
                            navigate({
                              to: '/chat/$conversationId',
                              params: { conversationId: item.id },
                            })
                          }
                        />
                      ))}
                    </SideNavSection>
                  )
                )
              })}
              {conversations.length === 0 && (
                <p className="sidebar-empty">没有找到匹配的会话</p>
              )}
            </WorkspaceSideNav>
            <main className="workspace-content">
              <Outlet />
            </main>
          </div>
        )}
      </div>
    </Theme>
  )
}
AppShell.displayName = 'AppShell'
