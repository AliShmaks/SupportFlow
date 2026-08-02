using System.ComponentModel.DataAnnotations;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class CreateTicketRequest
    {
        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        public TicketPriority Priority { get; set; }
            = TicketPriority.Normal;
    }
}