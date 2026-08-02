import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import api from '../api/axios'

const PermissionContext = createContext(null)

export function PermissionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] =
    useState(true)

  const loadPermissions = useCallback(async () => {
    try {
      setLoadingPermissions(true)

      const response = await api.get('/auth/me')
      const data = response.data

      setUser(data)

      setPermissions(
        Array.isArray(data?.permissions)
          ? data.permissions
          : []
      )

      sessionStorage.setItem(
        'supportflow_user',
        JSON.stringify(data)
      )
    } catch (error) {
      console.error(
        'Failed to load user permissions:',
        error
      )

      setUser(null)
      setPermissions([])
    } finally {
      setLoadingPermissions(false)
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (...requiredPermissions) => {
    return requiredPermissions.some((permission) =>
      permissions.includes(permission)
    )
  }

  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        loadingPermissions,
        hasPermission,
        hasAnyPermission,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)

  if (!context) {
    throw new Error(
      'usePermissions must be used inside PermissionProvider.'
    )
  }

  return context
}