import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'
import {
  PermissionProvider,
  usePermissions,
} from '../context/PermissionContext'
import './MainLayout.css'

function MainLayoutContent() {
  const navigate = useNavigate()

  const {
    user,
    loadingPermissions,
    hasPermission,
    hasAnyPermission,
  } = usePermissions()

  const handleLogout = () => {
    sessionStorage.removeItem(
      'supportflow_token'
    )

    sessionStorage.removeItem(
      'supportflow_user'
    )

    navigate('/login', {
      replace: true,
    })
  }

  const getLinkClass = ({ isActive }) =>
    `sidebar-link ${
      isActive ? 'active' : ''
    }`

  const canViewTickets =
    hasAnyPermission(
      'Tickets.ViewOwn',
      'Tickets.ViewAssigned',
      'Tickets.ViewAll'
    )

  if (loadingPermissions) {
    return (
      <div className="main-layout-loading">

      </div>
    )
  }

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <h1 className="sidebar-logo">
          SupportFlow
        </h1>

        <nav className="sidebar-menu">
          {hasPermission(
            'Dashboard.View'
          ) && (
            <NavLink
              to="/dashboard"
              className={getLinkClass}
            >
              Dashboard
            </NavLink>
          )}

          {canViewTickets && (
            <NavLink
              to="/tickets"
              className={getLinkClass}
            >
              Tickets
            </NavLink>
          )}

          {hasPermission(
            'Departments.View'
          ) && (
            <NavLink
              to="/departments"
              className={getLinkClass}
            >
              Departments
            </NavLink>
          )}

          {hasPermission(
            'Categories.View'
          ) && (
            <NavLink
              to="/categories"
              className={getLinkClass}
            >
              Categories
            </NavLink>
          )}

          {hasPermission(
            'Users.View'
          ) && (
            <NavLink
              to="/users"
              className={getLinkClass}
            >
              Users
            </NavLink>
          )}

          {hasPermission(
            'Roles.View'
          ) && (
            <NavLink
              to="/roles"
              className={getLinkClass}
            >
              Roles & Permissions
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="main-area">
        <header className="navbar">
          <h2 className="navbar-title">
            SupportFlow
          </h2>

          <div className="navbar-user-section">
            <span className="navbar-user">
              {user?.fullName || 'User'}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MainLayout() {
  return (
    <PermissionProvider>
      <MainLayoutContent />
    </PermissionProvider>
  )
}

export default MainLayout