import { useCallback, useEffect, useState } from 'react'
import {
  createUser,
  getRoles,
  getUsers,
  setUserActive,
  updateUser,
  updateUserRoles,
} from '../services/userService'
import { getDepartments } from '../services/departmentService'
import { usePermissions } from '../context/PermissionContext'
import './UsersPage.css'

function UsersPage() {
  const { hasPermission } = usePermissions()

  const canCreateUser = hasPermission('Users.Create')
  const canEditUser = hasPermission('Users.Edit')
  const canEditRoles = hasPermission('Users.EditRoles')
  const canChangeStatus = hasPermission('Users.ChangeStatus')

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [departments, setDepartments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================
  // CREATE USER
  // =========================

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    departmentId: '',
    isActive: true,
    roleIds: [],
  })

  // =========================
  // EDIT USER
  // =========================

  const [editingUser, setEditingUser] = useState(null)
  const [savingUserEdit, setSavingUserEdit] = useState(false)

  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    departmentId: '',
    isActive: true,
    roleIds: [],
    newPassword: '',
  })

  // =========================
  // MANAGE ROLES
  // =========================

  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [savingRoles, setSavingRoles] = useState(false)

  // =========================
  // ACTIVE STATUS
  // =========================

  const [changingActiveId, setChangingActiveId] =
    useState(null)

  // =========================
  // LOAD DATA
  // =========================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const needsRoles =
        canCreateUser ||
        canEditUser ||
        canEditRoles

      const needsDepartments =
        canCreateUser ||
        canEditUser

      const requests = [
        getUsers(),
      ]

      if (needsRoles) {
        requests.push(getRoles())
      }

      if (needsDepartments) {
        requests.push(getDepartments())
      }

      const results = await Promise.all(requests)

      const usersData = results[0]

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : []
      )

      let resultIndex = 1

      if (needsRoles) {
        const rolesData =
          results[resultIndex]

        setRoles(
          Array.isArray(rolesData)
            ? rolesData
            : []
        )

        resultIndex++
      } else {
        setRoles([])
      }

      if (needsDepartments) {
        const departmentsData =
          results[resultIndex]

        setDepartments(
          Array.isArray(departmentsData)
            ? departmentsData
            : departmentsData?.items ?? []
        )
      } else {
        setDepartments([])
      }
    } catch (err) {
      console.error(
        'Failed to load users:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Could not load users.'
      )
    } finally {
      setLoading(false)
    }
  }, [
    canCreateUser,
    canEditUser,
    canEditRoles,
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  // =========================
  // CREATE USER
  // =========================

  const resetCreateUserForm = () => {
    setCreateUserForm({
      fullName: '',
      email: '',
      password: '',
      departmentId: '',
      isActive: true,
      roleIds: [],
    })
  }

  const closeCreateUserModal = () => {
    if (creatingUser) {
      return
    }

    setShowCreateUser(false)
    resetCreateUserForm()
  }

  const handleCreateUserRoleToggle = (roleId) => {
    setCreateUserForm((current) => {
      const exists =
        current.roleIds.includes(roleId)

      return {
        ...current,

        roleIds: exists
          ? current.roleIds.filter(
              (id) => id !== roleId
            )
          : [
              ...current.roleIds,
              roleId,
            ],
      }
    })
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()

    if (!canCreateUser) {
      return
    }

    const fullName =
      createUserForm.fullName.trim()

    const email =
      createUserForm.email.trim()

    if (!fullName) {
      setError(
        'Full name is required.'
      )
      return
    }

    if (!email) {
      setError(
        'Email is required.'
      )
      return
    }

    if (!createUserForm.password) {
      setError(
        'Password is required.'
      )
      return
    }

    try {
      setCreatingUser(true)
      setError('')

      await createUser({
        fullName,
        email,

        password:
          createUserForm.password,

        departmentId:
          createUserForm.departmentId
            ? Number(
                createUserForm.departmentId
              )
            : null,

        isActive:
          createUserForm.isActive,

        roleIds:
          createUserForm.roleIds,
      })

      setShowCreateUser(false)
      resetCreateUserForm()

      await loadData()
    } catch (err) {
      console.error(
        'Failed to create user:',
        err
      )

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not create user.'
      )
    } finally {
      setCreatingUser(false)
    }
  }

  // =========================
  // EDIT USER
  // =========================

  const resetEditUserForm = () => {
    setEditUserForm({
      fullName: '',
      email: '',
      departmentId: '',
      isActive: true,
      roleIds: [],
      newPassword: '',
    })
  }

  const openEditUser = (user) => {
    if (!canEditUser) {
      return
    }

    setEditingUser(user)

    setEditUserForm({
      fullName:
        user.fullName ?? '',

      email:
        user.email ?? '',

      departmentId:
        user.departmentId
          ? String(user.departmentId)
          : '',

      isActive:
        user.isActive ?? true,

      roleIds:
        user.roles?.map(
          (role) => role.id
        ) ?? [],

      newPassword: '',
    })

    setError('')
  }

  const closeEditUser = () => {
    if (savingUserEdit) {
      return
    }

    setEditingUser(null)
    resetEditUserForm()
  }

  const handleEditUserRoleToggle = (roleId) => {
    setEditUserForm((current) => {
      const exists =
        current.roleIds.includes(roleId)

      return {
        ...current,

        roleIds: exists
          ? current.roleIds.filter(
              (id) => id !== roleId
            )
          : [
              ...current.roleIds,
              roleId,
            ],
      }
    })
  }

  const handleSaveUserEdit = async (event) => {
    event.preventDefault()

    if (
      !editingUser ||
      !canEditUser
    ) {
      return
    }

    const fullName =
      editUserForm.fullName.trim()

    const email =
      editUserForm.email.trim()

    if (!fullName) {
      setError(
        'Full name is required.'
      )
      return
    }

    if (!email) {
      setError(
        'Email is required.'
      )
      return
    }

    if (
      editUserForm.newPassword &&
      editUserForm.newPassword.length < 6
    ) {
      setError(
        'New password must be at least 6 characters.'
      )
      return
    }

    try {
      setSavingUserEdit(true)
      setError('')

      await updateUser(
        editingUser.id,
        {
          fullName,
          email,

          departmentId:
            editUserForm.departmentId
              ? Number(
                  editUserForm.departmentId
                )
              : null,

          isActive:
            editUserForm.isActive,

          roleIds:
            editUserForm.roleIds,

          newPassword:
            editUserForm.newPassword.trim()
              ? editUserForm.newPassword
              : null,
        }
      )

      setEditingUser(null)
      resetEditUserForm()

      await loadData()
    } catch (err) {
      console.error(
        'Failed to update user:',
        err
      )

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not update user.'
      )
    } finally {
      setSavingUserEdit(false)
    }
  }

  // =========================
  // MANAGE ROLES
  // =========================

  const openRoleManager = (user) => {
    if (!canEditRoles) {
      return
    }

    setSelectedUser(user)

    setSelectedRoleIds(
      user.roles?.map(
        (role) => role.id
      ) ?? []
    )

    setError('')
  }

  const closeRoleManager = () => {
    if (savingRoles) {
      return
    }

    setSelectedUser(null)
    setSelectedRoleIds([])
  }

  const handleRoleToggle = (roleId) => {
    if (!canEditRoles) {
      return
    }

    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter(
          (id) => id !== roleId
        )
      }

      return [
        ...current,
        roleId,
      ]
    })
  }

  const handleSaveRoles = async () => {
    if (
      !selectedUser ||
      !canEditRoles
    ) {
      return
    }

    try {
      setSavingRoles(true)
      setError('')

      await updateUserRoles(
        selectedUser.id,
        selectedRoleIds
      )

      setSelectedUser(null)
      setSelectedRoleIds([])

      await loadData()
    } catch (err) {
      console.error(
        'Failed to update roles:',
        err
      )

      setError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          'Could not update user roles.'
      )
    } finally {
      setSavingRoles(false)
    }
  }

  // =========================
  // ACTIVE / INACTIVE
  // =========================

  const handleToggleActive = async (user) => {
    if (!canChangeStatus) {
      return
    }

    const nextState =
      !user.isActive

    const confirmed =
      window.confirm(
        nextState
          ? `Activate ${user.fullName}?`
          : `Deactivate ${user.fullName}?`
      )

    if (!confirmed) {
      return
    }

    try {
      setChangingActiveId(
        user.id
      )

      setError('')

      await setUserActive(
        user.id,
        nextState
      )

      await loadData()
    } catch (err) {
      console.error(
        'Failed to update user status:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Could not update user status.'
      )
    } finally {
      setChangingActiveId(null)
    }
  }

  const hasActions =
    canEditUser ||
    canEditRoles ||
    canChangeStatus

  return (
    <section className="users-page">
      {/* HEADER */}

      <div className="users-header">
        <div>
          <h1>
            Users
          </h1>

          <p>
            Manage users, departments,
            roles, passwords, and account status.
          </p>
        </div>

        {canCreateUser && (
          <button
            type="button"
            className="create-user-button"
            onClick={() =>
              setShowCreateUser(true)
            }
          >
            Create User
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="users-error">
          {error}
        </div>
      )}

      {/* USERS TABLE */}

      <article className="users-card">
        <div className="users-card-header">
          <h2>
            All Users
          </h2>

          <span>
            {users.length}
          </span>
        </div>

        {loading ? (
          <div className="users-empty">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            No users found.
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Created</th>

                  {hasActions && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>
                        {user.fullName}
                      </strong>
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.departmentName ||
                        '—'}
                    </td>

                    <td>
                      <div className="user-role-list">
                        {!user.roles ||
                        user.roles.length === 0 ? (
                          <span className="user-no-role">
                            No roles
                          </span>
                        ) : (
                          user.roles.map(
                            (role) => (
                              <span
                                className="user-role-badge"
                                key={role.id}
                              >
                                {role.name}
                              </span>
                            )
                          )
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          user.isActive
                            ? 'user-status active'
                            : 'user-status inactive'
                        }
                      >
                        {user.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    {hasActions && (
                      <td>
                        <div className="user-actions">
                          {canEditUser && (
                            <button
                              type="button"
                              className="user-edit-button"
                              onClick={() =>
                                openEditUser(
                                  user
                                )
                              }
                            >
                              Edit User
                            </button>
                          )}

                          {canEditRoles && (
                            <button
                              type="button"
                              className="user-role-button"
                              onClick={() =>
                                openRoleManager(
                                  user
                                )
                              }
                            >
                              Manage Roles
                            </button>
                          )}

                          {canChangeStatus && (
                            <button
                              type="button"
                              className={
                                user.isActive
                                  ? 'user-deactivate-button'
                                  : 'user-activate-button'
                              }
                              onClick={() =>
                                handleToggleActive(
                                  user
                                )
                              }
                              disabled={
                                changingActiveId ===
                                user.id
                              }
                            >
                              {changingActiveId ===
                              user.id
                                ? 'Saving...'
                                : user.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
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

      {/* =========================
          CREATE USER MODAL
      ========================== */}

      {showCreateUser &&
        canCreateUser && (
          <div
            className="user-modal-backdrop"
            onMouseDown={
              closeCreateUserModal
            }
          >
            <form
              className="user-role-modal"
              onSubmit={
                handleCreateUser
              }
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="user-role-modal-header">
                <div>
                  <h2>
                    Create User
                  </h2>

                  <p>
                    Create a new
                    SupportFlow account.
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={
                    closeCreateUserModal
                  }
                  disabled={
                    creatingUser
                  }
                >
                  ×
                </button>
              </div>

              <div className="create-user-form">
                <div className="create-user-field">
                  <label htmlFor="create-full-name">
                    Full Name
                  </label>

                  <input
                    id="create-full-name"
                    type="text"
                    value={
                      createUserForm.fullName
                    }
                    onChange={(
                      event
                    ) =>
                      setCreateUserForm(
                        (current) => ({
                          ...current,

                          fullName:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    maxLength={100}
                    disabled={
                      creatingUser
                    }
                    required
                  />
                </div>

                <div className="create-user-field">
                  <label htmlFor="create-email">
                    Email
                  </label>

                  <input
                    id="create-email"
                    type="email"
                    value={
                      createUserForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      setCreateUserForm(
                        (current) => ({
                          ...current,

                          email:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    maxLength={150}
                    disabled={
                      creatingUser
                    }
                    required
                  />
                </div>

                <div className="create-user-field">
                  <label htmlFor="create-password">
                    Password
                  </label>

                  <input
                    id="create-password"
                    type="password"
                    value={
                      createUserForm.password
                    }
                    onChange={(
                      event
                    ) =>
                      setCreateUserForm(
                        (current) => ({
                          ...current,

                          password:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    minLength={6}
                    disabled={
                      creatingUser
                    }
                    required
                  />
                </div>

                <div className="create-user-field">
                  <label htmlFor="create-department">
                    Department
                  </label>

                  <select
                    id="create-department"
                    value={
                      createUserForm.departmentId
                    }
                    onChange={(
                      event
                    ) =>
                      setCreateUserForm(
                        (current) => ({
                          ...current,

                          departmentId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      creatingUser
                    }
                  >
                    <option value="">
                      No department
                    </option>

                    {departments
                      .filter(
                        (department) =>
                          department.isActive !==
                          false
                      )
                      .map(
                        (department) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="create-user-field">
                  <label>
                    Roles
                  </label>

                  <div className="create-user-role-list">
                    {roles.length ===
                    0 ? (
                      <p>
                        No roles available.
                      </p>
                    ) : (
                      roles.map(
                        (role) => (
                          <label
                            key={
                              role.id
                            }
                            className="user-role-option"
                          >
                            <input
                              type="checkbox"
                              checked={createUserForm.roleIds.includes(
                                role.id
                              )}
                              onChange={() =>
                                handleCreateUserRoleToggle(
                                  role.id
                                )
                              }
                              disabled={
                                creatingUser
                              }
                            />

                            <div>
                              <strong>
                                {
                                  role.name
                                }
                              </strong>

                              {role.description && (
                                <span>
                                  {
                                    role.description
                                  }
                                </span>
                              )}
                            </div>
                          </label>
                        )
                      )
                    )}
                  </div>
                </div>

                <label className="create-user-active">
                  <input
                    type="checkbox"
                    checked={
                      createUserForm.isActive
                    }
                    onChange={(
                      event
                    ) =>
                      setCreateUserForm(
                        (current) => ({
                          ...current,

                          isActive:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    disabled={
                      creatingUser
                    }
                  />

                  <span>
                    Active account
                  </span>
                </label>
              </div>

              <div className="user-role-modal-actions">
                <button
                  type="button"
                  className="user-modal-cancel"
                  onClick={
                    closeCreateUserModal
                  }
                  disabled={
                    creatingUser
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-modal-save"
                  disabled={
                    creatingUser
                  }
                >
                  {creatingUser
                    ? 'Creating...'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* =========================
          EDIT USER MODAL
      ========================== */}

      {editingUser &&
        canEditUser && (
          <div
            className="user-modal-backdrop"
            onMouseDown={
              closeEditUser
            }
          >
            <form
              className="user-role-modal"
              onSubmit={
                handleSaveUserEdit
              }
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="user-role-modal-header">
                <div>
                  <h2>
                    Edit User
                  </h2>

                  <p>
                    Update{' '}
                    {editingUser.fullName}
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={
                    closeEditUser
                  }
                  disabled={
                    savingUserEdit
                  }
                >
                  ×
                </button>
              </div>

              <div className="create-user-form">
                <div className="create-user-field">
                  <label htmlFor="edit-full-name">
                    Full Name
                  </label>

                  <input
                    id="edit-full-name"
                    type="text"
                    value={
                      editUserForm.fullName
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUserForm(
                        (current) => ({
                          ...current,

                          fullName:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    maxLength={100}
                    disabled={
                      savingUserEdit
                    }
                    required
                  />
                </div>

                <div className="create-user-field">
                  <label htmlFor="edit-email">
                    Email
                  </label>

                  <input
                    id="edit-email"
                    type="email"
                    value={
                      editUserForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUserForm(
                        (current) => ({
                          ...current,

                          email:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    maxLength={150}
                    disabled={
                      savingUserEdit
                    }
                    required
                  />
                </div>

                <div className="create-user-field">
                  <label htmlFor="edit-department">
                    Department
                  </label>

                  <select
                    id="edit-department"
                    value={
                      editUserForm.departmentId
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUserForm(
                        (current) => ({
                          ...current,

                          departmentId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      savingUserEdit
                    }
                  >
                    <option value="">
                      No department
                    </option>

                    {departments
                      .filter(
                        (department) =>
                          department.isActive !==
                          false
                      )
                      .map(
                        (department) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="create-user-field">
                  <label htmlFor="edit-new-password">
                    New Password
                  </label>

                  <input
                    id="edit-new-password"
                    type="password"
                    value={
                      editUserForm.newPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUserForm(
                        (current) => ({
                          ...current,

                          newPassword:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Leave blank to keep current password"
                    minLength={6}
                    disabled={
                      savingUserEdit
                    }
                  />

                  <small>
                    Leave blank if you
                    don't want to change
                    the password.
                  </small>
                </div>

                <div className="create-user-field">
                  <label>
                    Roles
                  </label>

                  <div className="create-user-role-list">
                    {roles.length ===
                    0 ? (
                      <p>
                        No roles available.
                      </p>
                    ) : (
                      roles.map(
                        (role) => (
                          <label
                            key={
                              role.id
                            }
                            className="user-role-option"
                          >
                            <input
                              type="checkbox"
                              checked={editUserForm.roleIds.includes(
                                role.id
                              )}
                              onChange={() =>
                                handleEditUserRoleToggle(
                                  role.id
                                )
                              }
                              disabled={
                                savingUserEdit
                              }
                            />

                            <div>
                              <strong>
                                {
                                  role.name
                                }
                              </strong>

                              {role.description && (
                                <span>
                                  {
                                    role.description
                                  }
                                </span>
                              )}
                            </div>
                          </label>
                        )
                      )
                    )}
                  </div>
                </div>

                <label className="create-user-active">
                  <input
                    type="checkbox"
                    checked={
                      editUserForm.isActive
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUserForm(
                        (current) => ({
                          ...current,

                          isActive:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    disabled={
                      savingUserEdit
                    }
                  />

                  <span>
                    Active account
                  </span>
                </label>
              </div>

              <div className="user-role-modal-actions">
                <button
                  type="button"
                  className="user-modal-cancel"
                  onClick={
                    closeEditUser
                  }
                  disabled={
                    savingUserEdit
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-modal-save"
                  disabled={
                    savingUserEdit
                  }
                >
                  {savingUserEdit
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* =========================
          MANAGE ROLES MODAL
      ========================== */}

      {selectedUser &&
        canEditRoles && (
          <div
            className="user-modal-backdrop"
            onMouseDown={
              closeRoleManager
            }
          >
            <div
              className="user-role-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="user-role-modal-header">
                <div>
                  <h2>
                    Manage Roles
                  </h2>

                  <p>
                    {
                      selectedUser.fullName
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={
                    closeRoleManager
                  }
                  disabled={
                    savingRoles
                  }
                >
                  ×
                </button>
              </div>

              <div className="user-role-options">
                {roles.map(
                  (role) => (
                    <label
                      className="user-role-option"
                      key={
                        role.id
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(
                          role.id
                        )}
                        onChange={() =>
                          handleRoleToggle(
                            role.id
                          )
                        }
                        disabled={
                          savingRoles
                        }
                      />

                      <div>
                        <strong>
                          {role.name}
                        </strong>

                        {role.description && (
                          <span>
                            {
                              role.description
                            }
                          </span>
                        )}
                      </div>
                    </label>
                  )
                )}
              </div>

              <div className="user-role-modal-actions">
                <button
                  type="button"
                  className="user-modal-cancel"
                  onClick={
                    closeRoleManager
                  }
                  disabled={
                    savingRoles
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-modal-save"
                  onClick={
                    handleSaveRoles
                  }
                  disabled={
                    savingRoles
                  }
                >
                  {savingRoles
                    ? 'Saving...'
                    : 'Save Roles'}
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  )
}

export default UsersPage