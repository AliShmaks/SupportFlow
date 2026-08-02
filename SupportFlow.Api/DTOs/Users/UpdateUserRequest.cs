using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Users
{
    public class UpdateUserRequest
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }

        public bool IsActive { get; set; }

        public List<int> RoleIds { get; set; } = new();

        [MinLength(6)]
        public string? NewPassword { get; set; }
    }
}