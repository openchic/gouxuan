import type { ThemePreference } from '../../shared/ipc'
import { RouterProvider } from '@tanstack/react-router'
import { WorkspaceProvider } from './components'
import { router } from './router'

type AppProps = { initialTheme: ThemePreference }
export const App = ({ initialTheme }: AppProps): React.JSX.Element => (
  <WorkspaceProvider initialTheme={initialTheme}>
    <RouterProvider router={router} />
  </WorkspaceProvider>
)
App.displayName = 'App'
