using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Interfaces;

namespace SupportFlow.Api.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;

        public PermissionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> HasPermissionAsync(
            int userId,
            string permissionName)
        {
            return await _context.UserRoles
                .AsNoTracking()
                .Where(userRole => userRole.UserId == userId)
                .SelectMany(userRole =>
                    userRole.Role.RolePermissions)
                .AnyAsync(rolePermission =>
                    rolePermission.Permission.Name == permissionName);
        }
    }
}