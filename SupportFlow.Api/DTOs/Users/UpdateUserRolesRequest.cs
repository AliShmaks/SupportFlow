namespace SupportFlow.Api.DTOs.Users
{
    public class UpdateUserRolesRequest
    {
        public List<int> RoleIds { get; set; } = new();
    }
}