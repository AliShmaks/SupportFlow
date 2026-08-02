namespace SupportFlow.Api.Models
{
    public class UserRole
    {
        public int UserId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        public int RoleId { get; set; }

        public Role Role { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}