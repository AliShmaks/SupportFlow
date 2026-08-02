import api from '../api/axios'

export const getAgents = async () => {
  const response = await api.get('/users/agents')
  return response.data
}

export const getUsers = async () => {
  const response = await api.get('/users')
  return response.data
}

export const getRoles = async () => {
  const response = await api.get('/users/roles')
  return response.data
}

export const updateUserRoles = async (userId, roleIds) => {
  const response = await api.put(
    `/users/${userId}/roles`,
    {
      roleIds,
    }
  )

  return response.data
}

export const setUserActive = async (userId, isActive) => {
  const response = await api.put(
    `/users/${userId}/active`,
    {
      isActive,
    }
  )

  return response.data
}


export const createUser = async (userData) => {
  const response = await api.post('/users', userData)
  return response.data
}


export const updateUser = async (userId, userData) => {
  const response = await api.put(
    `/users/${userId}`,
    userData
  )

  return response.data
}