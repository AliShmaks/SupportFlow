import { useCallback, useEffect, useState } from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { getTickets } from '../services/ticketService'
import { usePermissions } from '../context/PermissionContext'

import './TicketsPage.css'

function TicketsPage() {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const { hasPermission } = usePermissions()

  const canCreate =
    hasPermission('Tickets.Create')

  const [tickets, setTickets] = useState([])

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [page, setPage] =
    useState(1)

  const [pageSize] =
    useState(10)

  const [totalCount, setTotalCount] =
    useState(0)

  const [totalPages, setTotalPages] =
    useState(1)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const activeFilter =
    searchParams.get('filter') ?? ''

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const requestParams = {
        page,
        pageSize,
        search,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      }

      if (
        activeFilter &&
        activeFilter !== 'Unassigned'
      ) {
        requestParams.status =
          activeFilter
      }

      if (
        activeFilter === 'Unassigned'
      ) {
        requestParams.unassigned = true
      }

      const data =
        await getTickets(requestParams)

      setTickets(
        data?.items ?? []
      )

      setTotalCount(
        data?.totalCount ?? 0
      )

      setTotalPages(
        data?.totalPages ?? 1
      )
    } catch (err) {
      console.error(
        'Failed to load tickets:',
        err
      )

      const message =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Could not load tickets.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    search,
    activeFilter,
  ])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleSearch = (event) => {
    event.preventDefault()

    setPage(1)
    setSearch(
      searchInput.trim()
    )
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleClearFilter = () => {
    setSearchParams({})
    setPage(1)
  }

  const getStatusClass = (status) => {
    const value = String(
      status ?? ''
    )
      .toLowerCase()
      .replaceAll(' ', '-')

    return `ticket-badge ticket-status-${value}`
  }

  const getPriorityClass = (
    priority
  ) => {
    const value = String(
      priority ?? ''
    )
      .toLowerCase()
      .replaceAll(' ', '-')

    return `ticket-badge ticket-priority-${value}`
  }

  const getFilterLabel = () => {
    if (
      activeFilter === 'InProgress'
    ) {
      return 'In Progress'
    }

    if (
      activeFilter ===
      'WaitingForCustomer'
    ) {
      return 'Waiting For Customer'
    }

    return activeFilter
  }

  return (
    <section className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1>Tickets</h1>

          <p>
            Manage and review support tickets.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="create-ticket-button"
            onClick={() =>
              navigate('/tickets/create')
            }
          >
            Create Ticket
          </button>
        )}
      </div>

      <div className="tickets-panel">
        <div className="tickets-toolbar">
          <form
            className="ticket-search-form"
            onSubmit={handleSearch}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search tickets..."
              aria-label="Search tickets"
            />

            <button type="submit">
              Search
            </button>

            {search && (
              <button
                type="button"
                className="clear-search-button"
                onClick={
                  handleClearSearch
                }
              >
                Clear
              </button>
            )}
          </form>

          {activeFilter && (
            <div className="tickets-active-filter">
              <span>
                Filter:{' '}
                {getFilterLabel()}
              </span>

              <button
                type="button"
                onClick={
                  handleClearFilter
                }
              >
                Clear
              </button>
            </div>
          )}

          <span className="ticket-count">
            {totalCount}{' '}
            ticket
            {totalCount === 1
              ? ''
              : 's'}
          </span>
        </div>

        {error && (
          <div className="tickets-error">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={loadTickets}
            >
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <div className="tickets-table-container">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="tickets-state"
                    >
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="tickets-state"
                    >
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map(
                    (ticket) => (
                      <tr
                        key={ticket.id}
                        className="ticket-table-row"
                        onClick={() =>
                          navigate(
                            `/tickets/${ticket.id}`
                          )
                        }
                      >
                        <td>
                          <div className="ticket-main-info">
                            <span className="ticket-number">
                              #{ticket.id}
                            </span>

                            <span className="ticket-title">
                              {ticket.subject ||
                                'Untitled ticket'}
                            </span>
                          </div>
                        </td>

                        <td>
                          {ticket.departmentName ||
                            '—'}
                        </td>

                        <td>
                          {ticket.categoryName ||
                            '—'}
                        </td>

                        <td>
                          <span
                            className={
                              getStatusClass(
                                ticket.status
                              )
                            }
                          >
                            {ticket.status ||
                              'Unknown'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              getPriorityClass(
                                ticket.priority
                              )
                            }
                          >
                            {ticket.priority ||
                              'Unknown'}
                          </span>
                        </td>

                        <td>
                          {ticket.createdAt
                            ? new Date(
                                ticket.createdAt
                              ).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading &&
          !error &&
          totalPages > 1 && (
            <div className="tickets-pagination">
              <button
                type="button"
                disabled={
                  page === 1
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of{' '}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page ===
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
              >
                Next
              </button>
            </div>
          )}
      </div>
    </section>
  )
}

export default TicketsPage