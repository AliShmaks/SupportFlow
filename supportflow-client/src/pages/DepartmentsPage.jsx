import { useCallback, useEffect, useState } from 'react'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../services/departmentService'
import { usePermissions } from '../context/PermissionContext'
import './DepartmentsPage.css'

function DepartmentsPage() {
  const { hasPermission } = usePermissions()

  const canCreate = hasPermission('Departments.Create')
  const canEdit = hasPermission('Departments.Edit')
  const canDelete = hasPermission('Departments.Delete')

  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [isActive, setIsActive] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getDepartments()

      setDepartments(
        Array.isArray(data)
          ? data
          : data?.items ?? []
      )
    } catch (err) {
      console.error('Failed to load departments:', err)

      setError(
        err.response?.data?.message ||
          'Could not load departments.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const resetForm = () => {
    setName('')
    setDescription('')
    setEditingId(null)
    setIsActive(true)
    setError('')
  }

  const handleEdit = (department) => {
    if (!canEdit) {
      return
    }

    setEditingId(department.id)
    setName(department.name ?? '')
    setDescription(department.description ?? '')
    setIsActive(department.isActive ?? true)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (editingId && !canEdit) {
      setError(
        'You do not have permission to edit departments.'
      )
      return
    }

    if (!editingId && !canCreate) {
      setError(
        'You do not have permission to create departments.'
      )
      return
    }

    const cleanedName = name.trim()
    const cleanedDescription = description.trim()

    if (!cleanedName) {
      setError('Department name is required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (editingId) {
        await updateDepartment(editingId, {
          name: cleanedName,
          description: cleanedDescription || null,
          isActive,
        })
      } else {
        await createDepartment({
          name: cleanedName,
          description: cleanedDescription || null,
        })
      }

      resetForm()
      await loadDepartments()
    } catch (err) {
      console.error('Failed to save department:', err)

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not save department.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (departmentId) => {
    if (!canDelete) {
      setError(
        'You do not have permission to deactivate departments.'
      )
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to deactivate this department?'
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(departmentId)
      setError('')

      await deleteDepartment(departmentId)

      if (editingId === departmentId) {
        resetForm()
      }

      await loadDepartments()
    } catch (err) {
      console.error('Failed to deactivate department:', err)

      setError(
        err.response?.data?.message ||
          'Could not deactivate department.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="departments-page">
      <div className="departments-header">
        <div>
          <h1>Departments</h1>
          <p>
            Manage the departments used to organize support tickets.
          </p>
        </div>
      </div>

      {error && (
        <div className="departments-error">
          {error}
        </div>
      )}

      <div
        className={
          canCreate || canEdit
            ? 'departments-layout'
            : 'departments-layout departments-layout-single'
        }
      >
        {(canCreate || editingId) && (
          <article className="departments-card">
            <div className="departments-card-header">
              <h2>
                {editingId
                  ? 'Edit Department'
                  : 'Create Department'}
              </h2>
            </div>

            <form
              className="department-form"
              onSubmit={handleSubmit}
            >
              <div className="department-form-group">
                <label htmlFor="department-name">
                  Name
                </label>

                <input
                  id="department-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  disabled={submitting}
                  placeholder="e.g. Technical Support"
                  required
                />
              </div>

              <div className="department-form-group">
                <label htmlFor="department-description">
                  Description
                </label>

                <textarea
                  id="department-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={300}
                  disabled={submitting}
                  rows={5}
                  placeholder="Short department description"
                />
              </div>

              {editingId && (
                <label className="department-active-option">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(event.target.checked)
                    }
                    disabled={submitting}
                  />

                  <span>Active department</span>
                </label>
              )}

              <div className="department-form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="department-cancel-button"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="department-save-button"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Department'}
                </button>
              </div>
            </form>
          </article>
        )}

        <article className="departments-card">
          <div className="departments-card-header">
            <h2>All Departments</h2>

            <span>{departments.length}</span>
          </div>

          {loading ? (
            <div className="departments-empty">
              Loading departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="departments-empty">
              No departments found.
            </div>
          ) : (
            <div className="departments-table-wrapper">
              <table className="departments-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>

                    {(canEdit || canDelete) && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td>
                        <strong>
                          {department.name}
                        </strong>
                      </td>

                      <td>
                        {department.description || '—'}
                      </td>

                      <td>
                        <span
                          className={
                            department.isActive
                              ? 'department-status active'
                              : 'department-status inactive'
                          }
                        >
                          {department.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      {(canEdit || canDelete) && (
                        <td>
                          <div className="department-actions">
                            {canEdit && (
                              <button
                                type="button"
                                className="department-edit-button"
                                onClick={() =>
                                  handleEdit(department)
                                }
                              >
                                Edit
                              </button>
                            )}

                            {canDelete &&
                              department.isActive && (
                                <button
                                  type="button"
                                  className="department-delete-button"
                                  onClick={() =>
                                    handleDelete(
                                      department.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    department.id
                                  }
                                >
                                  {deletingId ===
                                  department.id
                                    ? 'Deactivating...'
                                    : 'Deactivate'}
                                </button>
                              )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default DepartmentsPage