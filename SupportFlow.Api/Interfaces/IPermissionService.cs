namespace SupportFlow.Api.Interfaces
{
    public interface IPermissionService
    {
        Task<bool> HasPermissionAsync(
            int userId,
            string permissionName);
    }
}