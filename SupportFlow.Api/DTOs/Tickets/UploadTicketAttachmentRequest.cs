using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Tickets
{
    public class UploadTicketAttachmentRequest
    {
        [Required]
        public IFormFile File { get; set; } = null!;
    }
}