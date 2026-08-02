using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SupportFlow.Api.Interfaces;
using System.Security.Claims;

namespace SupportFlow.Api.Helpers
{
    public class PermissionAuthorizationFilter
        : IAsyncAuthorizationFilter
    {
        private readonly string _permissionName;
        private readonly IPermissionService _permissionService;

        public PermissionAuthorizationFilter(
            string permissionName,
            IPermissionService permissionService)
        {
            _permissionName = permissionName;
            _permissionService = permissionService;
        }

        public async Task OnAuthorizationAsync(
            AuthorizationFilterContext context)
        {
            ClaimsPrincipal user = context.HttpContext.User;

            if (user.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "Authentication is required."
                });

                return;
            }

            string? userIdValue = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out int userId))
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "Invalid authentication token."
                });

                return;
            }

            bool hasPermission =
                await _permissionService.HasPermissionAsync(
                    userId,
                    _permissionName);

            if (!hasPermission)
            {
                context.Result = new ObjectResult(new
                {
                    message =
                        $"You do not have the '{_permissionName}' permission."
                })
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
            }
        }
    }
}