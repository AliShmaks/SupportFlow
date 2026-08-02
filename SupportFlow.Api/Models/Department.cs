using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Category> Categories { get; set; } = new List<Category>();

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();

        public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();


    }
}