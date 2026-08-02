import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import CreateTicketPage from './pages/CreateTicketPage'
import TicketDetailsPage from './pages/TicketDetailsPage'
import DepartmentsPage from './pages/DepartmentsPage'
import CategoriesPage from './pages/CategoriesPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'

import ProtectedRoute from './routes/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import MainLayout from './layouts/MainLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PermissionRoute permission="Dashboard.View">
                <DashboardPage />
              </PermissionRoute>
            }
          />

          {/* Tickets */}
          <Route
            path="/tickets"
            element={
              <PermissionRoute
                anyPermissions={[
                  'Tickets.ViewOwn',
                  'Tickets.ViewAssigned',
                  'Tickets.ViewAll',
                ]}
              >
                <TicketsPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/tickets/create"
            element={
              <PermissionRoute permission="Tickets.Create">
                <CreateTicketPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/tickets/:ticketId"
            element={
              <PermissionRoute
                anyPermissions={[
                  'Tickets.ViewOwn',
                  'Tickets.ViewAssigned',
                  'Tickets.ViewAll',
                ]}
              >
                <TicketDetailsPage />
              </PermissionRoute>
            }
          />

          {/* Departments */}
          <Route
            path="/departments"
            element={
              <PermissionRoute permission="Departments.View">
                <DepartmentsPage />
              </PermissionRoute>
            }
          />

          {/* Categories */}
          <Route
            path="/categories"
            element={
              <PermissionRoute permission="Categories.View">
                <CategoriesPage />
              </PermissionRoute>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <PermissionRoute permission="Users.View">
                <UsersPage />
              </PermissionRoute>
            }
          />

          {/* Roles & Permissions */}
          <Route
            path="/roles"
            element={
              <PermissionRoute permission="Roles.View">
                <RolesPage />
              </PermissionRoute>
            }
          />
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App