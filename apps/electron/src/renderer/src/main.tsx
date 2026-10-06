import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StartupError } from './components'
import './styles.css'

const start = async (): Promise<void> => {
  const element = document.getElementById('root')
  if (!element) throw new Error('Root element is missing')
  const root = createRoot(element)
  try {
    const result = await window.desktop.appearance.getPreference()
    if (!result.ok) throw new Error(result.error.message)
    root.render(
      <StrictMode>
        <App initialTheme={result.value} />
      </StrictMode>
    )
  } catch {
    root.render(<StartupError />)
  }
}
void start()
