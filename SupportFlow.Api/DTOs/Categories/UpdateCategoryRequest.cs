using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Categories
{
    public class UpdateCategoryRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Description { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        public bool IsActive { get; set; }
    }
}