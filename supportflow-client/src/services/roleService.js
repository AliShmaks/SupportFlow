import api from '../api/axios'

export const getRoles = async () => {
  const response = await api.get('/roles')

  return response.data
}

export const getPermissions = async () => {
  const response = await api.get(
    '/roles/permissions'
  )

  return response.data
}

export const updateRolePermissions = async (
  roleId,
  permissionIds
) => {
  const response = await api.put(
    `/roles/${roleId}/permissions`,
    {
      permissionIds,
    }
  )

  return response.data
}