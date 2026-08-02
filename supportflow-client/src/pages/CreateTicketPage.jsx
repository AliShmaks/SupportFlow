import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createTicket,
  getCreateTicketCategories,
} from '../services/ticketService'

import { usePermissions } from '../context/PermissionContext'

import './CreateTicketPage.css'

function CreateTicketPage() {
  const navigate = useNavigate()

  const {
    user,
    loadingPermissions,
  } = usePermissions()

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    categoryId: '',
    priority: '2',
  })

  const [categories, setCategories] = useState([])

  const [loadingCategories, setLoadingCategories] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        setError('')

        const data = await getCreateTicketCategories()

        setCategories(
          Array.isArray(data)
            ? data
            : data?.items ?? []
        )
      } catch (err) {
        console.error(
          'Failed to load categories:',
          err
        )

        setError(
          err.response?.data?.message ||
            'Could not load categories.'
        )
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  const departmentCategories =
    useMemo(() => {
      if (!user?.departmentId) {
        return []
      }

      return categories.filter(
        (category) =>
          Number(category.departmentId) ===
            Number(user.departmentId) &&
          category.isActive !== false
      )
    }, [
      categories,
      user?.departmentId,
    ])

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!user?.departmentId) {
      setError(
        'Your account is not assigned to a department.'
      )
      return
    }

    if (!formData.categoryId) {
      setError(
        'Please select a category.'
      )
      return
    }

    const subject =
      formData.subject.trim()

    const description =
      formData.description.trim()

    if (!subject) {
      setError(
        'Subject is required.'
      )
      return
    }

    if (!description) {
      setError(
        'Description is required.'
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const createdTicket =
        await createTicket({
          subject,
          description,

          departmentId:
            Number(user.departmentId),

          categoryId:
            Number(formData.categoryId),

          priority:
            Number(formData.priority),
        })

      const ticketId =
        createdTicket.id ??
        createdTicket.ticketId

      if (ticketId) {
        navigate(
          `/tickets/${ticketId}`,
          {
            replace: true,
          }
        )

        return
      }

      navigate(
        '/tickets',
        {
          replace: true,
        }
      )
    } catch (err) {
      console.error(
        'Failed to create ticket:',
        err
      )

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not create the ticket.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (
    loadingPermissions ||
    loadingCategories
  ) {
    return (
      <p>
        Loading ticket form...
      </p>
    )
  }

  return (
    <section className="create-ticket-page">
      <div className="create-ticket-header">
        <div>
          <h1>
            Create Ticket
          </h1>

          <p>
            Submit a new support request.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate('/tickets')
          }
        >
          Back to Tickets
        </button>
      </div>

      <form
        className="create-ticket-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="create-ticket-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="subject">
            Subject
          </label>

          <input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Briefly describe the issue"
            maxLength={200}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description
          </label>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Explain the issue in detail"
            rows={7}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Department
            </label>

            <input
              type="text"
              value={
                user?.departmentName ||
                'No department assigned'
              }
              disabled
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoryId">
              Category
            </label>

            <select
              id="categoryId"
              name="categoryId"
              value={
                formData.categoryId
              }
              onChange={handleChange}
              disabled={
                submitting ||
                !user?.departmentId
              }
              required
            >
              <option value="">
                Select category
              </option>

              {departmentCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {!user?.departmentId && (
          <div className="create-ticket-error">
            Your account has no department assigned.
            Contact an administrator.
          </div>
        )}

        {user?.departmentId &&
          departmentCategories.length === 0 && (
            <div className="create-ticket-error">
              No active categories are available for
              your department.
            </div>
          )}

        <div className="form-group">
          <label htmlFor="priority">
            Priority
          </label>

          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={submitting}
            required
          >
            <option value="1">
              Low
            </option>

            <option value="2">
              Normal
            </option>

            <option value="3">
              High
            </option>

            <option value="4">
              Urgent
            </option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() =>
              navigate('/tickets')
            }
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-ticket-button"
            disabled={
              submitting ||
              !user?.departmentId ||
              departmentCategories.length === 0
            }
          >
            {submitting
              ? 'Creating...'
              : 'Create Ticket'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateTicketPage