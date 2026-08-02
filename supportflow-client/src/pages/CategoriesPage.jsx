import { useCallback, useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../services/categoryService'
import { getDepartments } from '../services/departmentService'
import { usePermissions } from '../context/PermissionContext'
import './CategoriesPage.css'

function CategoriesPage() {
  const { hasPermission } = usePermissions()

  const canCreate = hasPermission('Categories.Create')
  const canEdit = hasPermission('Categories.Edit')
  const canDelete = hasPermission('Categories.Delete')

  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [categoriesData, departmentsData] =
        await Promise.all([
          getCategories(),
          getDepartments(),
        ])

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData?.items ?? []
      )

      setDepartments(
        Array.isArray(departmentsData)
          ? departmentsData
          : departmentsData?.items ?? []
      )
    } catch (err) {
      console.error('Failed to load categories:', err)

      setError(
        err.response?.data?.message ||
          'Could not load categories.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setName('')
    setDescription('')
    setDepartmentId('')
    setIsActive(true)
    setEditingId(null)
    setError('')
  }

  const handleEdit = (category) => {
    if (!canEdit) {
      return
    }

    setEditingId(category.id)
    setName(category.name ?? '')
    setDescription(category.description ?? '')

    setDepartmentId(
      String(category.departmentId ?? '')
    )

    setIsActive(category.isActive ?? true)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (editingId && !canEdit) {
      setError(
        'You do not have permission to edit categories.'
      )
      return
    }

    if (!editingId && !canCreate) {
      setError(
        'You do not have permission to create categories.'
      )
      return
    }

    const cleanedName = name.trim()
    const cleanedDescription = description.trim()

    if (!cleanedName) {
      setError('Category name is required.')
      return
    }

    if (!departmentId) {
      setError('Please select a department.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (editingId) {
        await updateCategory(editingId, {
          name: cleanedName,
          description: cleanedDescription || null,
          departmentId: Number(departmentId),
          isActive,
        })
      } else {
        await createCategory({
          name: cleanedName,
          description: cleanedDescription || null,
          departmentId: Number(departmentId),
        })
      }

      resetForm()
      await loadData()
    } catch (err) {
      console.error('Failed to save category:', err)

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not save category.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (categoryId) => {
    if (!canDelete) {
      setError(
        'You do not have permission to deactivate categories.'
      )
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to deactivate this category?'
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(categoryId)
      setError('')

      await deleteCategory(categoryId)

      if (editingId === categoryId) {
        resetForm()
      }

      await loadData()
    } catch (err) {
      console.error('Failed to deactivate category:', err)

      setError(
        err.response?.data?.message ||
          'Could not deactivate category.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const getDepartmentName = (category) => {
    if (category.departmentName) {
      return category.departmentName
    }

    const department = departments.find(
      (item) => item.id === category.departmentId
    )

    return department?.name ?? '—'
  }

  return (
    <section className="categories-page">
      <div className="categories-header">
        <div>
          <h1>Categories</h1>

          <p>
            Manage ticket categories and connect them to departments.
          </p>
        </div>
      </div>

      {error && (
        <div className="categories-error">
          {error}
        </div>
      )}

      <div
        className={
          canCreate || canEdit
            ? 'categories-layout'
            : 'categories-layout categories-layout-single'
        }
      >
        {(canCreate || editingId) && (
          <article className="categories-card">
            <div className="categories-card-header">
              <h2>
                {editingId
                  ? 'Edit Category'
                  : 'Create Category'}
              </h2>
            </div>

            <form
              className="category-form"
              onSubmit={handleSubmit}
            >
              <div className="category-form-group">
                <label htmlFor="category-name">
                  Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  disabled={submitting}
                  placeholder="e.g. Login Problems"
                  required
                />
              </div>

              <div className="category-form-group">
                <label htmlFor="category-department">
                  Department
                </label>

                <select
                  id="category-department"
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(event.target.value)
                  }
                  disabled={submitting}
                  required
                >
                  <option value="">
                    Select department
                  </option>

                  {departments
                    .filter(
                      (department) =>
                        department.isActive !== false
                    )
                    .map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="category-form-group">
                <label htmlFor="category-description">
                  Description
                </label>

                <textarea
                  id="category-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={300}
                  disabled={submitting}
                  rows={5}
                  placeholder="Short category description"
                />
              </div>

              {editingId && (
                <label className="category-active-option">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(event.target.checked)
                    }
                    disabled={submitting}
                  />

                  <span>Active category</span>
                </label>
              )}

              <div className="category-form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="category-cancel-button"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="category-save-button"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </article>
        )}

        <article className="categories-card">
          <div className="categories-card-header">
            <h2>All Categories</h2>

            <span>{categories.length}</span>
          </div>

          {loading ? (
            <div className="categories-empty">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="categories-empty">
              No categories found.
            </div>
          ) : (
            <div className="categories-table-wrapper">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th>Status</th>

                    {(canEdit || canDelete) && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <strong>
                          {category.name}
                        </strong>
                      </td>

                      <td>
                        {getDepartmentName(category)}
                      </td>

                      <td>
                        {category.description || '—'}
                      </td>

                      <td>
                        <span
                          className={
                            category.isActive
                              ? 'category-status active'
                              : 'category-status inactive'
                          }
                        >
                          {category.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      {(canEdit || canDelete) && (
                        <td>
                          <div className="category-actions">
                            {canEdit && (
                              <button
                                type="button"
                                className="category-edit-button"
                                onClick={() =>
                                  handleEdit(category)
                                }
                              >
                                Edit
                              </button>
                            )}

                            {canDelete &&
                              category.isActive && (
                                <button
                                  type="button"
                                  className="category-delete-button"
                                  onClick={() =>
                                    handleDelete(category.id)
                                  }
                                  disabled={
                                    deletingId === category.id
                                  }
                                >
                                  {deletingId === category.id
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

export default CategoriesPage