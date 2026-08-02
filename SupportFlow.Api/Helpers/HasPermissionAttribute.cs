using Microsoft.AspNetCore.Mvc;

namespace SupportFlow.Api.Helpers
{
    public class HasPermissionAttribute : TypeFilterAttribute
    {
        public HasPermissionAttribute(string permissionName)
            : base(typeof(PermissionAuthorizationFilter))
        {
            Arguments = new object[]
            {
                permissionName
            };
        }
    }
}