import { Link } from '@tanstack/react-router'
import './index.css'

export const NotFound = (): React.JSX.Element => (
  <div className="not-found">
    <h1>页面没有找到</h1>
    <p>可以返回工作台继续浏览。</p>
    <Link to="/chat">返回问答</Link>
  </div>
)
NotFound.displayName = 'NotFound'
