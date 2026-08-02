import { Navigate } from 'react-router-dom'
import { usePermissions } from '../context/PermissionContext'

function PermissionRoute({
  permission,
  anyPermissions = [],
  children,
}) {
  const {
    loadingPermissions,
    hasPermission,
    hasAnyPermission,
  } = usePermissions()

  if (loadingPermissions) {
    return <p>Loading...</p>
  }

  const allowed = permission
    ? hasPermission(permission)
    : anyPermissions.length > 0
      ? hasAnyPermission(...anyPermissions)
      : true

  if (!allowed) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}

export default PermissionRoute