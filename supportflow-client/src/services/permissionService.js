import api from '../api/axios'

export const getCurrentUserPermissions = async () => {
  const response = await api.get('/auth/me')

  return response.data
}