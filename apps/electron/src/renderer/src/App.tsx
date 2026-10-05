import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

function App(): React.JSX.Element {
  return (
    <Theme theme={neutralTheme}>
      <main>钩玄</main>
    </Theme>
  )
}

export default App
