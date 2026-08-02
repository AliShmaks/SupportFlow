import api from '../api/axios'

export const getTickets = async (params = {}) => {
  const response = await api.get('/tickets', {
    params,
  })

  return response.data
}

export const getTicketById = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`)

  return response.data
}

export const createTicket = async (ticketData) => {
  const response = await api.post('/tickets', ticketData)

  return response.data
}

export const addTicketMessage = async (ticketId, messageData) => {
  const response = await api.post(
    `/tickets/${ticketId}/messages`,
    messageData
  )

  return response.data
}

export const uploadTicketAttachment = async (ticketId, file) => {
  const formData = new FormData()

  formData.append('File', file)

  const response = await api.post(
    `/tickets/${ticketId}/attachments`,
    formData
  )

  return response.data
}

export const changeTicketStatus = async (ticketId, status) => {
  const response = await api.put(
    `/tickets/${ticketId}/status`,
    {
      status: Number(status),
    }
  )

  return response.data
}

export const assignTicket = async (ticketId, agentId) => {
  const response = await api.put(
    `/tickets/${ticketId}/assign`,
    {
      agentId: Number(agentId),
    }
  )

  return response.data
}


export const getTicketAttachments = async (ticketId) => {
  const response = await api.get(
    `/tickets/${ticketId}/attachments`
  )

  return response.data
}

export const deleteTicketAttachment = async (
  ticketId,
  attachmentId
) => {
  const response = await api.delete(
    `/tickets/${ticketId}/attachments/${attachmentId}`
  )

  return response.data
}


export const getTicketMessages = async (ticketId) => {
  const response = await api.get(
    `/tickets/${ticketId}/messages`
  )

  return response.data
}


export const getCreateTicketCategories = async () => {
  const response = await api.get(
    '/tickets/categories'
  )

  return response.data
}