using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public int DepartmentId { get; set; }

        public Department Department { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}