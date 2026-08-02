using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Roles;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [HasPermission(PermissionNames.RolesView)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .OrderBy(role => role.Name)
                .Select(role => new
                {
                    role.Id,
                    role.Name,
                    role.Description,
                    role.IsSystemRole,

                    UserCount = role.UserRoles.Count,

                    Permissions =
                        role.RolePermissions
                            .Select(rolePermission => new
                            {
                                rolePermission.Permission.Id,
                                rolePermission.Permission.Name
                            })
                            .OrderBy(permission =>
                                permission.Name)
                            .ToList()
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpGet("permissions")]
        [HasPermission(PermissionNames.RolesView)]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions
                .AsNoTracking()
                .OrderBy(permission =>
                    permission.Name)
                .Select(permission => new
                {
                    permission.Id,
                    permission.Name,
                    permission.Description
                })
                .ToListAsync();

            return Ok(permissions);
        }

        [HttpGet("{id:int}/permissions")]
        [HasPermission(PermissionNames.RolesView)]
        public async Task<IActionResult> GetRolePermissions(
            int id)
        {
            Role? role = await _context.Roles
                .AsNoTracking()
                .Include(role =>
                    role.RolePermissions)
                .ThenInclude(rolePermission =>
                    rolePermission.Permission)
                .FirstOrDefaultAsync(role =>
                    role.Id == id);

            if (role is null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            return Ok(new
            {
                role.Id,
                role.Name,

                Permissions =
                    role.RolePermissions
                        .Select(rolePermission => new
                        {
                            rolePermission.Permission.Id,
                            rolePermission.Permission.Name,
                            rolePermission.Permission.Description
                        })
                        .OrderBy(permission =>
                            permission.Name)
                        .ToList()
            });
        }

        [HttpPut("{id:int}/permissions")]
        [HasPermission(
            PermissionNames.RolesManagePermissions)]
        public async Task<IActionResult> UpdatePermissions(
            int id,
            UpdateRolePermissionsRequest request)
        {
            Role? role = await _context.Roles
                .Include(role =>
                    role.RolePermissions)
                .FirstOrDefaultAsync(role =>
                    role.Id == id);

            if (role is null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            List<int> requestedIds =
                request.PermissionIds
                    .Distinct()
                    .ToList();

            List<Permission> permissions =
                await _context.Permissions
                    .Where(permission =>
                        requestedIds.Contains(
                            permission.Id))
                    .ToListAsync();

            if (permissions.Count != requestedIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more permissions are invalid."
                });
            }

            _context.RolePermissions.RemoveRange(
                role.RolePermissions);

            foreach (Permission permission in permissions)
            {
                role.RolePermissions.Add(
                    new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permission.Id
                    });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                role.Id,
                role.Name,

                Permissions = permissions
                    .Select(permission => new
                    {
                        permission.Id,
                        permission.Name
                    })
                    .OrderBy(permission =>
                        permission.Name)
            });
        }
    }
}