using SupportFlow.Api.Models;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class TicketQueryRequest
    {
        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public string? Search { get; set; }

        public TicketStatus? Status { get; set; }

        public TicketPriority? Priority { get; set; }

        public int? DepartmentId { get; set; }

        public int? CategoryId { get; set; }

        public string SortBy { get; set; } = "CreatedAt";

        public string SortDirection { get; set; } = "desc";
    }
}