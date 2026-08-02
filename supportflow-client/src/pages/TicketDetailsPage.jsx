import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addTicketMessage,
  assignTicket,
  changeTicketStatus,
  deleteTicketAttachment,
  getTicketAttachments,
  getTicketById,
  getTicketMessages,
  uploadTicketAttachment,
} from '../services/ticketService'
import { getAgents } from '../services/userService'
import { usePermissions } from '../context/PermissionContext'
import './TicketDetailsPage.css'

const ticketStatuses = [
  { value: 1, label: 'New' },
  { value: 2, label: 'Open' },
  { value: 3, label: 'In Progress' },
  { value: 4, label: 'Waiting For Customer' },
  { value: 5, label: 'Resolved' },
  { value: 6, label: 'Closed' },
  { value: 7, label: 'Reopened' },
]

function TicketDetailsPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const {
    hasPermission,
    hasAnyPermission,
  } = usePermissions()

  const canReply =
    hasPermission('Tickets.Reply')

  const canAssign =
    hasPermission('Tickets.Assign')

  const canChangeStatus =
    hasPermission('Tickets.ChangeStatus')

  const canSeeInternalNotes =
    hasAnyPermission(
      'Tickets.ViewAll',
      'Tickets.ViewAssigned'
    )

  const canCreateInternalNote =
    canReply && canSeeInternalNotes

  const canUploadAttachment =
    canReply

  const canDeleteAttachment =
    canReply ||
    hasPermission('Tickets.ViewAll')

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [submittingMessage, setSubmittingMessage] = useState(false)
  const [messageError, setMessageError] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [attachmentError, setAttachmentError] = useState('')

  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(true)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null)

  const [selectedStatus, setSelectedStatus] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [assigningTicket, setAssigningTicket] = useState(false)
  const [assignError, setAssignError] = useState('')

  const getStatusValue = (status) => {
    if (!status) {
      return ''
    }

    if (typeof status === 'number') {
      return status
    }

    const normalizedStatus = String(status)
      .replace(/\s+/g, '')
      .toLowerCase()

    const matchedStatus = ticketStatuses.find(
      (item) =>
        item.label
          .replace(/\s+/g, '')
          .toLowerCase() === normalizedStatus
    )

    return matchedStatus?.value ?? ''
  }

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getTicketById(ticketId)

      setTicket(data)
      setSelectedStatus(
        getStatusValue(data.status)
      )

      setSelectedAgent(
        data.assignedAgentId ?? ''
      )
    } catch (err) {
      console.error('Failed to load ticket:', err)

      if (err.response?.status === 404) {
        setError('Ticket was not found.')
      } else if (err.response?.status === 403) {
        setError(
          'You do not have permission to view this ticket.'
        )
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not load the ticket.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  const loadMessages = useCallback(async () => {
    try {
      setLoadingMessages(true)
      setMessageError('')

      const data =
        await getTicketMessages(ticketId)

      setMessages(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      console.error('Failed to load messages:', err)

      setMessageError(
        err.response?.data?.message ||
          'Could not load replies.'
      )
    } finally {
      setLoadingMessages(false)
    }
  }, [ticketId])

  const loadAgents = useCallback(async () => {
    if (!canAssign) {
      setAgents([])
      setLoadingAgents(false)
      return
    }

    try {
      setLoadingAgents(true)
      setAssignError('')

      const data = await getAgents()

      setAgents(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      console.error('Failed to load agents:', err)

      setAssignError(
        err.response?.data?.message ||
          'Could not load agents.'
      )
    } finally {
      setLoadingAgents(false)
    }
  }, [canAssign])

  const loadAttachments = useCallback(async () => {
    try {
      setLoadingAttachments(true)
      setAttachmentError('')

      const data =
        await getTicketAttachments(ticketId)

      setAttachments(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      console.error('Failed to load attachments:', err)

      setAttachmentError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not load attachments.'
      )
    } finally {
      setLoadingAttachments(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadTicket()
    loadMessages()
    loadAttachments()

    if (canAssign) {
      loadAgents()
    }
  }, [
    loadTicket,
    loadMessages,
    loadAttachments,
    loadAgents,
    canAssign,
  ])

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleString()
  }

  const formatFileSize = (bytes) => {
    if (
      bytes === null ||
      bytes === undefined
    ) {
      return ''
    }

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`
  }

  const handleAddMessage = async (event) => {
    event.preventDefault()

    if (!canReply) {
      setMessageError(
        'You do not have permission to reply to tickets.'
      )
      return
    }

    if (
      isInternalNote &&
      !canCreateInternalNote
    ) {
      setMessageError(
        'You do not have permission to create internal notes.'
      )
      return
    }

    const cleanedMessage =
      message.trim()

    if (!cleanedMessage) {
      setMessageError(
        'Please enter a message.'
      )
      return
    }

    try {
      setSubmittingMessage(true)
      setMessageError('')

      await addTicketMessage(
        ticketId,
        {
          message: cleanedMessage,
          isInternalNote,
        }
      )

      setMessage('')
      setIsInternalNote(false)

      await Promise.all([
        loadMessages(),
        loadTicket(),
      ])
    } catch (err) {
      console.error(
        'Failed to add ticket message:',
        err
      )

      if (err.response?.status === 403) {
        setMessageError(
          'You do not have permission to reply to this ticket.'
        )
      } else {
        setMessageError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not add the message.'
        )
      }
    } finally {
      setSubmittingMessage(false)
    }
  }

  const handleUploadAttachment = async (event) => {
    event.preventDefault()

    if (!canUploadAttachment) {
      setAttachmentError(
        'You do not have permission to upload attachments.'
      )
      return
    }

    if (!selectedFile) {
      setAttachmentError(
        'Please choose a file.'
      )
      return
    }

    try {
      setUploadingAttachment(true)
      setAttachmentError('')

      await uploadTicketAttachment(
        ticketId,
        selectedFile
      )

      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await Promise.all([
        loadAttachments(),
        loadTicket(),
      ])
    } catch (err) {
      console.error(
        'Failed to upload attachment:',
        err
      )

      if (err.response?.status === 403) {
        setAttachmentError(
          'You do not have permission to upload attachments.'
        )
      } else {
        setAttachmentError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not upload the attachment.'
        )
      }
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (
    attachmentId
  ) => {
    if (!canDeleteAttachment) {
      setAttachmentError(
        'You do not have permission to delete attachments.'
      )
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this attachment?'
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingAttachmentId(
        attachmentId
      )

      setAttachmentError('')

      await deleteTicketAttachment(
        ticketId,
        attachmentId
      )

      await loadAttachments()
    } catch (err) {
      console.error(
        'Failed to delete attachment:',
        err
      )

      if (err.response?.status === 403) {
        setAttachmentError(
          'You do not have permission to delete this attachment.'
        )
      } else {
        setAttachmentError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not delete the attachment.'
        )
      }
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const handleStatusChange = async (
    event
  ) => {
    if (!canChangeStatus) {
      return
    }

    const newStatus =
      Number(event.target.value)

    if (!newStatus) {
      return
    }

    const previousStatus =
      selectedStatus

    setSelectedStatus(newStatus)
    setStatusError('')

    try {
      setChangingStatus(true)

      await changeTicketStatus(
        ticketId,
        newStatus
      )

      await loadTicket()
    } catch (err) {
      console.error(
        'Failed to change ticket status:',
        err
      )

      setSelectedStatus(
        previousStatus
      )

      if (err.response?.status === 403) {
        setStatusError(
          'You do not have permission to change the ticket status.'
        )
      } else {
        setStatusError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not change the ticket status.'
        )
      }
    } finally {
      setChangingStatus(false)
    }
  }

  const handleAgentChange = async (
    event
  ) => {
    if (!canAssign) {
      return
    }

    const newAgentId =
      Number(event.target.value)

    if (!newAgentId) {
      return
    }

    const previousAgent =
      selectedAgent

    setSelectedAgent(
      newAgentId
    )

    setAssignError('')

    try {
      setAssigningTicket(true)

      await assignTicket(
        ticketId,
        newAgentId
      )

      await loadTicket()
    } catch (err) {
      console.error(
        'Failed to assign ticket:',
        err
      )

      setSelectedAgent(
        previousAgent
      )

      if (err.response?.status === 403) {
        setAssignError(
          'You do not have permission to assign tickets.'
        )
      } else {
        setAssignError(
          err.response?.data?.message ||
            err.response?.data?.title ||
            'Could not assign the ticket.'
        )
      }
    } finally {
      setAssigningTicket(false)
    }
  }

  if (loading) {
    return (
      <section className="ticket-details-page">
        <p>Loading ticket...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="ticket-details-page">
        <div className="ticket-details-error">
          <p>{error}</p>

          <div className="ticket-error-actions">
            <button
              type="button"
              onClick={loadTicket}
            >
              Try Again
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate('/tickets')
              }
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="ticket-details-page">
      <div className="ticket-details-header">
        <div>
          <button
            type="button"
            className="back-link"
            onClick={() =>
              navigate('/tickets')
            }
          >
            ← Back to Tickets
          </button>

          <div className="ticket-heading">
            <span className="ticket-details-number">
              Ticket #{ticket.id}
            </span>

            <h1>
              {ticket.subject ||
                'Untitled ticket'}
            </h1>
          </div>
        </div>
      </div>

      <div className="ticket-details-grid">
        <div className="ticket-main-column">

          {/* Description */}

          <article className="ticket-details-card">
            <div className="ticket-card-header">
              <h2>Description</h2>
            </div>

            <div className="ticket-description">
              {ticket.description ||
                'No description was provided.'}
            </div>
          </article>

          {/* Replies */}

          <article className="ticket-details-card">
            <div className="ticket-card-header">
              <h2>Replies</h2>

              <span>
                {messages.length}
              </span>
            </div>

            {loadingMessages ? (
              <div className="ticket-empty-state">
                Loading replies...
              </div>
            ) : messages.length === 0 ? (
              <div className="ticket-empty-state">
                No replies have been added yet.
              </div>
            ) : (
              <div className="ticket-replies">
                {messages.map((reply) => (
                  <div
                    className="ticket-reply"
                    key={reply.id}
                  >
                    <div className="ticket-reply-header">
                      <strong>
                        {reply.senderName ||
                          'User'}
                      </strong>

                      <span>
                        {formatDate(
                          reply.createdAt
                        )}
                      </span>
                    </div>

                    {reply.isInternalNote && (
                      <span className="internal-note-badge">
                        Internal note
                      </span>
                    )}

                    <p>
                      {reply.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {canReply && (
              <form
                className="ticket-message-form"
                onSubmit={
                  handleAddMessage
                }
              >
                <div className="ticket-message-form-header">
                  <h3>
                    {isInternalNote
                      ? 'Add Internal Note'
                      : 'Add Reply'}
                  </h3>
                </div>

                {messageError && (
                  <div className="ticket-message-error">
                    {messageError}
                  </div>
                )}

                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(
                      event.target.value
                    )

                    setMessageError('')
                  }}
                  placeholder={
                    isInternalNote
                      ? 'Write an internal note...'
                      : 'Write your reply...'
                  }
                  rows={5}
                  maxLength={5000}
                  disabled={
                    submittingMessage
                  }
                />

                <div className="ticket-message-footer">
                  {canCreateInternalNote && (
                    <label className="internal-note-option">
                      <input
                        type="checkbox"
                        checked={
                          isInternalNote
                        }
                        onChange={(
                          event
                        ) =>
                          setIsInternalNote(
                            event.target
                              .checked
                          )
                        }
                        disabled={
                          submittingMessage
                        }
                      />

                      <span>
                        Internal note
                      </span>
                    </label>
                  )}

                  <div className="ticket-message-actions">
                    <span className="message-character-count">
                      {message.length}/5000
                    </span>

                    <button
                      type="submit"
                      className="send-message-button"
                      disabled={
                        submittingMessage ||
                        !message.trim()
                      }
                    >
                      {submittingMessage
                        ? 'Sending...'
                        : isInternalNote
                          ? 'Add Internal Note'
                          : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </article>

          {/* Attachments */}

          <article className="ticket-details-card">
            <div className="ticket-card-header">
              <h2>Attachments</h2>

              <span>
                {attachments.length}
              </span>
            </div>

            {attachmentError && (
              <div className="ticket-message-error">
                {attachmentError}
              </div>
            )}

            {loadingAttachments ? (
              <div className="ticket-empty-state">
                Loading attachments...
              </div>
            ) : attachments.length === 0 ? (
              <div className="ticket-empty-state">
                No attachments have been uploaded yet.
              </div>
            ) : (
              <div className="ticket-attachments-list">
                {attachments.map(
                  (attachment) => (
                    <div
                      className="ticket-attachment-item"
                      key={
                        attachment.id
                      }
                    >
                      <div className="ticket-attachment-info">
                        <strong>
                          {
                            attachment.fileName
                          }
                        </strong>

                        <span>
                          {formatFileSize(
                            attachment.fileSize
                          )}
                        </span>
                      </div>

                      {canDeleteAttachment && (
                        <div className="ticket-attachment-actions">
                          <button
                            type="button"
                            className="delete-attachment-button"
                            onClick={() =>
                              handleDeleteAttachment(
                                attachment.id
                              )
                            }
                            disabled={
                              deletingAttachmentId ===
                              attachment.id
                            }
                          >
                            {deletingAttachmentId ===
                            attachment.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {canUploadAttachment && (
              <form
                className="ticket-attachment-form"
                onSubmit={
                  handleUploadAttachment
                }
              >
                <div className="ticket-attachment-header">
                  <h3>
                    Add Attachment
                  </h3>
                </div>

                <div className="ticket-attachment-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(
                      event
                    ) => {
                      setSelectedFile(
                        event.target
                          .files?.[0] ??
                          null
                      )

                      setAttachmentError(
                        ''
                      )
                    }}
                    disabled={
                      uploadingAttachment
                    }
                  />

                  <button
                    type="submit"
                    className="upload-attachment-button"
                    disabled={
                      uploadingAttachment ||
                      !selectedFile
                    }
                  >
                    {uploadingAttachment
                      ? 'Uploading...'
                      : 'Upload File'}
                  </button>
                </div>

                {selectedFile && (
                  <p className="selected-file-name">
                    Selected:{' '}
                    {selectedFile.name}
                  </p>
                )}
              </form>
            )}
          </article>
        </div>

        {/* Ticket Info */}

        <aside className="ticket-side-column">
          <article className="ticket-details-card">
            <div className="ticket-card-header">
              <h2>
                Ticket Information
              </h2>
            </div>

            <dl className="ticket-information">

              {/* Status */}

              <div>
                <dt>Status</dt>

                <dd>
                  {canChangeStatus ? (
                    <>
                      <select
                        className="ticket-status-select"
                        value={
                          selectedStatus
                        }
                        onChange={
                          handleStatusChange
                        }
                        disabled={
                          changingStatus
                        }
                      >
                        <option
                          value=""
                          disabled
                        >
                          Select Status
                        </option>

                        {ticketStatuses.map(
                          (status) => (
                            <option
                              key={
                                status.value
                              }
                              value={
                                status.value
                              }
                            >
                              {
                                status.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      {changingStatus && (
                        <span className="ticket-status-saving">
                          Saving...
                        </span>
                      )}

                      {statusError && (
                        <p className="ticket-status-error">
                          {statusError}
                        </p>
                      )}
                    </>
                  ) : (
                    <span>
                      {ticket.status ||
                        '—'}
                    </span>
                  )}
                </dd>
              </div>

              {/* Priority */}

              <div>
                <dt>Priority</dt>

                <dd>
                  {ticket.priority ||
                    '—'}
                </dd>
              </div>

              {/* Department */}

              <div>
                <dt>Department</dt>

                <dd>
                  {ticket.departmentName ||
                    '—'}
                </dd>
              </div>

              {/* Category */}

              <div>
                <dt>Category</dt>

                <dd>
                  {ticket.categoryName ||
                    '—'}
                </dd>
              </div>

              {/* Creator */}

              <div>
                <dt>Created By</dt>

                <dd>
                  {ticket.customerName ||
                    '—'}
                </dd>
              </div>

              {/* Assigned */}

              <div>
                <dt>Assigned To</dt>

                <dd>
                  {canAssign ? (
                    <>
                      <select
                        className="ticket-agent-select"
                        value={
                          selectedAgent
                        }
                        onChange={
                          handleAgentChange
                        }
                        disabled={
                          loadingAgents ||
                          assigningTicket
                        }
                      >
                        <option value="">
                          {loadingAgents
                            ? 'Loading agents...'
                            : 'Select Agent'}
                        </option>

                        {agents.map(
                          (agent) => (
                            <option
                              key={
                                agent.id
                              }
                              value={
                                agent.id
                              }
                            >
                              {
                                agent.fullName
                              }
                            </option>
                          )
                        )}
                      </select>

                      {assigningTicket && (
                        <span className="ticket-status-saving">
                          Assigning...
                        </span>
                      )}

                      {assignError && (
                        <p className="ticket-status-error">
                          {assignError}
                        </p>
                      )}
                    </>
                  ) : (
                    <span>
                      {ticket.assignedAgentName ||
                        'Unassigned'}
                    </span>
                  )}
                </dd>
              </div>

              {/* Dates */}

              <div>
                <dt>Created</dt>

                <dd>
                  {formatDate(
                    ticket.createdAt
                  )}
                </dd>
              </div>

              <div>
                <dt>Last Updated</dt>

                <dd>
                  {formatDate(
                    ticket.updatedAt
                  )}
                </dd>
              </div>
            </dl>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default TicketDetailsPage