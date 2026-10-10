import appIconUrl from '../../../../../../../build/icons/gouxuan-v1/source/app-icon.svg?url'
import './index.css'

/** Displays the current application SVG without duplicating its geometry. */
export const LoginLogo = (): React.JSX.Element => (
  <img
    src={appIconUrl}
    className="login-logo"
    alt=""
    aria-hidden="true"
    draggable={false}
  />
)
LoginLogo.displayName = 'LoginLogo'
