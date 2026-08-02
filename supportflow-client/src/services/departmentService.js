import api from '../api/axios'

export const getDepartments = async () => {
  const response = await api.get('/departments')
  return response.data
}

export const getDepartmentById = async (departmentId) => {
  const response = await api.get(
    `/departments/${departmentId}`
  )

  return response.data
}

export const createDepartment = async (departmentData) => {
  const response = await api.post(
    '/departments',
    departmentData
  )

  return response.data
}

export const updateDepartment = async (
  departmentId,
  departmentData
) => {
  const response = await api.put(
    `/departments/${departmentId}`,
    departmentData
  )

  return response.data
}

export const deleteDepartment = async (departmentId) => {
  const response = await api.delete(
    `/departments/${departmentId}`
  )

  return response.data
}