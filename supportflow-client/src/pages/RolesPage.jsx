import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getPermissions,
  getRoles,
  updateRolePermissions,
} from '../services/roleService'
import {
  usePermissions,
} from '../context/PermissionContext'
import './RolesPage.css'

function RolesPage() {
  const {
    hasPermission,
    refreshPermissions,
  } = usePermissions()

  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] =
    useState([])

  const [selectedRoleId, setSelectedRoleId] =
    useState('')

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const canManage =
    hasPermission(
      'Roles.ManagePermissions'
    )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [
        rolesData,
        permissionsData,
      ] = await Promise.all([
        getRoles(),
        getPermissions(),
      ])

      setRoles(
        Array.isArray(rolesData)
          ? rolesData
          : []
      )

      setPermissions(
        Array.isArray(permissionsData)
          ? permissionsData
          : []
      )

      if (
        Array.isArray(rolesData) &&
        rolesData.length > 0
      ) {
        setSelectedRoleId(
          String(rolesData[0].id)
        )

        setSelectedPermissionIds(
          rolesData[0].permissions.map(
            permission =>
              permission.id
          )
        )
      }
    } catch (err) {
      console.error(
        'Failed to load roles:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Could not load roles.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedRole = roles.find(
    role =>
      String(role.id) ===
      String(selectedRoleId)
  )

  const groupedPermissions =
    useMemo(() => {
      return permissions.reduce(
        (groups, permission) => {
          const group =
            permission.name.split('.')[0]

          if (!groups[group]) {
            groups[group] = []
          }

          groups[group].push(
            permission
          )

          return groups
        },
        {}
      )
    }, [permissions])

  const handleRoleChange = (
    event
  ) => {
    const roleId =
      event.target.value

    setSelectedRoleId(roleId)

    const role = roles.find(
      item =>
        String(item.id) ===
        String(roleId)
    )

    setSelectedPermissionIds(
      role?.permissions?.map(
        permission =>
          permission.id
      ) ?? []
    )
  }

  const togglePermission = (
    permissionId
  ) => {
    if (!canManage) {
      return
    }

    setSelectedPermissionIds(
      current => {
        if (
          current.includes(
            permissionId
          )
        ) {
          return current.filter(
            id =>
              id !== permissionId
          )
        }

        return [
          ...current,
          permissionId,
        ]
      }
    )
  }

  const handleSave = async () => {
    if (!selectedRoleId) {
      return
    }

    try {
      setSaving(true)
      setError('')

      await updateRolePermissions(
        Number(selectedRoleId),
        selectedPermissionIds
      )

      await loadData()

      await refreshPermissions()
    } catch (err) {
      console.error(
        'Failed to update permissions:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Could not update permissions.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading roles...</p>
  }

  return (
    <section className="roles-page">
      <div className="roles-header">
        <div>
          <h1>
            Roles & Permissions
          </h1>

          <p>
            Control what every role
            can see and do.
          </p>
        </div>
      </div>

      {error && (
        <div className="roles-error">
          {error}
        </div>
      )}

      <article className="roles-card">
        <div className="role-selector">
          <label htmlFor="role">
            Role
          </label>

          <select
            id="role"
            value={selectedRoleId}
            onChange={handleRoleChange}
          >
            {roles.map(role => (
              <option
                key={role.id}
                value={role.id}
              >
                {role.name}
              </option>
            ))}
          </select>

          {selectedRole && (
            <span>
              {selectedRole.userCount}{' '}
              user(s)
            </span>
          )}
        </div>
      </article>

      <div className="permission-groups">
        {Object.entries(
          groupedPermissions
        ).map(
          ([
            groupName,
            groupPermissions,
          ]) => (
            <article
              className="permission-card"
              key={groupName}
            >
              <div className="permission-card-header">
                <h2>
                  {groupName}
                </h2>
              </div>

              <div className="permission-list">
                {groupPermissions.map(
                  permission => (
                    <label
                      key={
                        permission.id
                      }
                      className="permission-option"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedPermissionIds.includes(
                            permission.id
                          )
                        }
                        onChange={() =>
                          togglePermission(
                            permission.id
                          )
                        }
                        disabled={
                          !canManage ||
                          saving
                        }
                      />

                      <div>
                        <strong>
                          {
                            permission.name
                          }
                        </strong>

                        {permission.description && (
                          <span>
                            {
                              permission.description
                            }
                          </span>
                        )}
                      </div>
                    </label>
                  )
                )}
              </div>
            </article>
          )
        )}
      </div>

      {canManage && (
        <div className="roles-save-bar">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Permissions'}
          </button>
        </div>
      )}
    </section>
  )
}

export default RolesPage