using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.DTOs.Users
{
    public class CreateUserRequest
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }

        public bool IsActive { get; set; } = true;

        public List<int> RoleIds { get; set; } = new();
    }
}