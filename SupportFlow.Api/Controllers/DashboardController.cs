using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Interfaces;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(
            IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        [HasPermission(PermissionNames.DashboardView)]
        public async Task<IActionResult> GetSummary()
        {
            object result =
                await _dashboardService.GetSummaryAsync();

            return Ok(result);
        }
    }
}