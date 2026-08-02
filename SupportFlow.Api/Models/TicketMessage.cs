using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models
{
    public class TicketMessage
    {
        public int Id { get; set; }

        public int TicketId { get; set; }

        public Ticket Ticket { get; set; } = null!;

        public int SenderId { get; set; }

        public ApplicationUser Sender { get; set; } = null!;

        [Required]
        [MaxLength(5000)]
        public string Message { get; set; } = string.Empty;

        public bool IsInternalNote { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}