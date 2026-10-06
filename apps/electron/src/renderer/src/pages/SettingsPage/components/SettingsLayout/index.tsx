import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Icon } from '@astryxdesign/core/Icon'
import { WorkspaceSideNav } from '../../../../components'
import './index.css'

export const SettingsLayout = (): React.JSX.Element => {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const navigate = useNavigate()
  const isGeneral = pathname === '/settings' || pathname === '/settings/'
  return (
    <div className="settings-layout">
      <WorkspaceSideNav
        aria-label="设置菜单"
        header={
          <Link to="/chat" className="settings-back">
            <Icon icon="chevronLeft" size="sm" />
            返回问答
          </Link>
        }>
        <SideNavSection title="设置选项" isHeaderHidden>
          <SideNavItem
            label="通用设置"
            icon="wrench"
            isSelected={isGeneral}
            aria-current={isGeneral ? 'page' : undefined}
            onClick={() => navigate({ to: '/settings' })}
          />
          <SideNavItem
            label="知识库"
            icon="viewColumns"
            isSelected={pathname === '/settings/knowledge'}
            aria-current={
              pathname === '/settings/knowledge' ? 'page' : undefined
            }
            onClick={() => navigate({ to: '/settings/knowledge' })}
          />
        </SideNavSection>
      </WorkspaceSideNav>
      <main className="settings-body">
        <Outlet />
      </main>
    </div>
  )
}
SettingsLayout.displayName = 'SettingsLayout'
