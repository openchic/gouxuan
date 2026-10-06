import './index.css'

export const StartupError = (): React.JSX.Element => (
  <main className="startup-error">
    <h1>客户端初始化失败</h1>
    <p>未能连接本地运行层，请关闭窗口后重新打开客户端。</p>
  </main>
)
StartupError.displayName = 'StartupError'
