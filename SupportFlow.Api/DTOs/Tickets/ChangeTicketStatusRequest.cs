using System.ComponentModel.DataAnnotations;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class ChangeTicketStatusRequest
    {
        [Required]
        public TicketStatus Status { get; set; }
    }
}