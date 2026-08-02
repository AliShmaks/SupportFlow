using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class CreateTicketMessageRequest
    {
        [Required]
        [MaxLength(5000)]
        public string Message { get; set; } = string.Empty;

        public bool IsInternalNote { get; set; } = false;
    }
}