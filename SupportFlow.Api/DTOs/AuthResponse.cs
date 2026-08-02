namespace SupportFlow.Api.DTOs.Auth
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;

        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public List<string> Roles { get; set; } = new();

        public DateTime ExpiresAt { get; set; }
    }
}