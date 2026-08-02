using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Departments
{
    public class UpdateDepartmentRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }
}