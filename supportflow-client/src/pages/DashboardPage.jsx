import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../services/dashboardService'
import './DashboardPage.css'

function DashboardPage() {
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getDashboardSummary()

      setSummary(data)
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)

      const message =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Could not load dashboard summary.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

 const cards = [
  {
    title: 'Total Tickets',
    value: summary?.totalTickets ?? 0,
    filter: '',
  },
  {
    title: 'New',
    value: summary?.newTickets ?? 0,
    filter: 'New',
  },
  {
    title: 'In Progress',
    value: summary?.inProgressTickets ?? 0,
    filter: 'InProgress',
  },
  {
    title: 'Resolved',
    value: summary?.resolvedTickets ?? 0,
    filter: 'Resolved',
  },
  {
    title: 'Closed',
    value: summary?.closedTickets ?? 0,
    filter: 'Closed',
  },
  {
    title: 'Unassigned',
    value: summary?.unassignedTickets ?? 0,
    filter: 'Unassigned',
  },
]

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your support tickets.</p>
        </div>

        <button
          type="button"
          className="dashboard-create-button"
          onClick={() => navigate('/tickets/create')}
        >
          Create Ticket
        </button>
      </div>

      {loading ? (
        <div className="dashboard-state">
          Loading dashboard...
        </div>
      ) : error ? (
        <div className="dashboard-error">
          <span>{error}</span>

          <button type="button" onClick={loadSummary}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="dashboard-cards">
          {cards.map((card) => (
            <button
              type="button"
              className="dashboard-card"
              key={card.title}
              onClick={() => {
                    if (!card.filter) {
                      navigate('/tickets')
                      return
                    }

                    navigate(`/tickets?filter=${encodeURIComponent(card.filter)}`)
                  }}
            >
              <p className="dashboard-card-title">
                {card.title}
              </p>

              <p className="dashboard-card-value">
                {card.value}
              </p>

              <span className="dashboard-card-link">
                View tickets →
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default DashboardPage