using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models
{
    public class Ticket
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        public TicketStatus Status { get; set; } = TicketStatus.New;

        public TicketPriority Priority { get; set; } = TicketPriority.Normal;

        // Customer
        public int CustomerId { get; set; }

        public ApplicationUser Customer { get; set; } = null!;

        // Department
        public int DepartmentId { get; set; }

        public Department Department { get; set; } = null!;

        // Category
        public int CategoryId { get; set; }

        public Category Category { get; set; } = null!;

        // Assigned Agent
        public int? AssignedAgentId { get; set; }

        public ApplicationUser? AssignedAgent { get; set; }

        // Dates
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ResolvedAt { get; set; }

        public DateTime? ClosedAt { get; set; }

        public ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
        public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();

    }
}