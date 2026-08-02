using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models
{
    public class ApplicationUser
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? DepartmentId { get; set; }

        public Department? Department { get; set; }

        public ICollection<UserRole> UserRoles { get; set; }
            = new List<UserRole>();

        public ICollection<Ticket> CreatedTickets { get; set; }
            = new List<Ticket>();

        public ICollection<Ticket> AssignedTickets { get; set; }
            = new List<Ticket>();

        public ICollection<TicketMessage> SentMessages { get; set; }
            = new List<TicketMessage>();

        public ICollection<TicketAttachment> UploadedAttachments { get; set; }
            = new List<TicketAttachment>();
    }
}