namespace SupportFlow.Api.DTOs.Roles
{
    public class UpdateRolePermissionsRequest
    {
        public List<int> PermissionIds { get; set; }
            = new();
    }
}