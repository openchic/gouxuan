import type { SideNavProps } from '@astryxdesign/core/SideNav'
import { SideNav } from '@astryxdesign/core/SideNav'
import './index.css'

type WorkspaceSideNavProps = Omit<SideNavProps, 'className'>

export const WorkspaceSideNav = (
  props: WorkspaceSideNavProps
): React.JSX.Element => <SideNav {...props} className="workspace-sidebar" />
WorkspaceSideNav.displayName = 'WorkspaceSideNav'
