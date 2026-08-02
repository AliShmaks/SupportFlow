using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Data
{
    public static class PermissionSeeder
    {
        public static async Task SeedAsync(
            AppDbContext context)
        {
            await EnsurePermissionsAsync(context);

            await EnsureRolePermissionsAsync(context);
        }

        private static async Task EnsurePermissionsAsync(
            AppDbContext context)
        {
            var existingNames = await context.Permissions
                .Select(permission => permission.Name)
                .ToListAsync();

            foreach (string permissionName in PermissionNames.All)
            {
                if (existingNames.Contains(permissionName))
                {
                    continue;
                }

                context.Permissions.Add(new Permission
                {
                    Name = permissionName,
                    Description = GetDescription(permissionName)
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task EnsureRolePermissionsAsync(
            AppDbContext context)
        {
            Role? admin = await context.Roles
                .Include(role => role.RolePermissions)
                .FirstOrDefaultAsync(role =>
                    role.Name == "Admin");

            Role? customer = await context.Roles
                .Include(role => role.RolePermissions)
                .FirstOrDefaultAsync(role =>
                    role.Name == "Customer");

            Role? agent = await context.Roles
                .Include(role => role.RolePermissions)
                .FirstOrDefaultAsync(role =>
                    role.Name == "Agent");

            Role? supervisor = await context.Roles
                .Include(role => role.RolePermissions)
                .FirstOrDefaultAsync(role =>
                    role.Name == "Supervisor");

            var permissions = await context.Permissions
                .ToListAsync();

            // Admin always receives every permission.
            if (admin is not null)
            {
                AddMissingPermissions(
                    admin,
                    permissions.Select(p => p.Name),
                    permissions);
            }

            if (customer is not null)
            {
                AddMissingPermissions(
                    customer,
                    new[]
                    {
                        PermissionNames.DashboardView,
                        PermissionNames.TicketsViewOwn,
                        PermissionNames.TicketsCreate,
                        PermissionNames.TicketsReply,
                        PermissionNames.DepartmentsView,
                        PermissionNames.CategoriesView
                    },
                    permissions);
            }

            if (agent is not null)
            {
                AddMissingPermissions(
                    agent,
                    new[]
                    {
                        PermissionNames.DashboardView,
                        PermissionNames.TicketsViewAssigned,
                        PermissionNames.TicketsReply,
                        PermissionNames.TicketsChangeStatus,
                        PermissionNames.DepartmentsView,
                        PermissionNames.CategoriesView
                    },
                    permissions);
            }

            if (supervisor is not null)
            {
                AddMissingPermissions(
                    supervisor,
                    new[]
                    {
                        PermissionNames.DashboardView,
                        PermissionNames.TicketsViewAll,
                        PermissionNames.TicketsCreate,
                        PermissionNames.TicketsReply,
                        PermissionNames.TicketsAssign,
                        PermissionNames.TicketsChangeStatus,
                        PermissionNames.DepartmentsView,
                        PermissionNames.CategoriesView
                    },
                    permissions);
            }

            await context.SaveChangesAsync();
        }

        private static void AddMissingPermissions(
            Role role,
            IEnumerable<string> permissionNames,
            List<Permission> permissions)
        {
            foreach (string permissionName in permissionNames)
            {
                Permission? permission = permissions
                    .FirstOrDefault(p =>
                        p.Name == permissionName);

                if (permission is null)
                {
                    continue;
                }

                bool alreadyExists =
                    role.RolePermissions.Any(rp =>
                        rp.PermissionId == permission.Id);

                if (alreadyExists)
                {
                    continue;
                }

                role.RolePermissions.Add(
                    new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permission.Id
                    });
            }
        }

        private static string GetDescription(
            string permissionName)
        {
            return permissionName switch
            {
                PermissionNames.DashboardView =>
                    "View the dashboard.",

                PermissionNames.TicketsViewOwn =>
                    "View tickets created by the current user.",

                PermissionNames.TicketsViewAssigned =>
                    "View tickets assigned to the current user.",

                PermissionNames.TicketsViewAll =>
                    "View all tickets.",

                PermissionNames.TicketsCreate =>
                    "Create tickets.",

                PermissionNames.TicketsReply =>
                    "Reply to tickets.",

                PermissionNames.TicketsAssign =>
                    "Assign tickets to agents.",

                PermissionNames.TicketsChangeStatus =>
                    "Change ticket status.",

                PermissionNames.DepartmentsView =>
                    "View departments.",

                PermissionNames.DepartmentsCreate =>
                    "Create departments.",

                PermissionNames.DepartmentsEdit =>
                    "Edit departments.",

                PermissionNames.DepartmentsDelete =>
                    "Deactivate departments.",

                PermissionNames.CategoriesView =>
                    "View categories.",

                PermissionNames.CategoriesCreate =>
                    "Create categories.",

                PermissionNames.CategoriesEdit =>
                    "Edit categories.",

                PermissionNames.CategoriesDelete =>
                    "Deactivate categories.",

                PermissionNames.UsersView =>
                    "View users.",

                PermissionNames.UsersEditRoles =>
                    "Change user roles.",

                PermissionNames.UsersChangeStatus =>
                    "Activate or deactivate users.",

                PermissionNames.RolesView =>
                    "View roles and permissions.",

                PermissionNames.RolesManagePermissions =>
                    "Change role permissions.",

                _ => permissionName
            };
        }
    }
}