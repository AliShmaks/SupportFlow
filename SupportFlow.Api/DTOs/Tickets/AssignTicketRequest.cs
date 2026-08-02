using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class AssignTicketRequest
    {
        [Required]
        public int AgentId { get; set; }
    }
}