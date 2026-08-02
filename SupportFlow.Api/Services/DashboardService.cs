using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetSummaryAsync()
        {
            int totalTickets =
                await _context.Tickets.CountAsync();

            int newTickets =
                await _context.Tickets.CountAsync(ticket =>
                    ticket.Status == TicketStatus.New);

            int inProgressTickets =
                await _context.Tickets.CountAsync(ticket =>
                    ticket.Status == TicketStatus.InProgress);

            int resolvedTickets =
                await _context.Tickets.CountAsync(ticket =>
                    ticket.Status == TicketStatus.Resolved);

            int closedTickets =
                await _context.Tickets.CountAsync(ticket =>
                    ticket.Status == TicketStatus.Closed);

            int unassignedTickets =
                await _context.Tickets.CountAsync(ticket =>
                    ticket.AssignedAgentId == null);

            return new
            {
                totalTickets,
                newTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets,
                unassignedTickets
            };
        }
    }
}