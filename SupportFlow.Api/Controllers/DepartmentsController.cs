using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Api.DTOs.Departments;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Interfaces;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(
            IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        [HasPermission(PermissionNames.DepartmentsView)]
        public async Task<IActionResult> GetAll()
        {
            object result =
                await _departmentService.GetAllAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [HasPermission(PermissionNames.DepartmentsView)]
        public async Task<IActionResult> GetById(int id)
        {
            object? result =
                await _departmentService.GetByIdAsync(id);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            return Ok(result);
        }

        [HttpPost]
        [HasPermission(PermissionNames.DepartmentsCreate)]
        public async Task<IActionResult> Create(
            CreateDepartmentRequest request)
        {
            object result =
                await _departmentService.CreateAsync(request);

            return Created(string.Empty, result);
        }

        [HttpPut("{id:int}")]
        [HasPermission(PermissionNames.DepartmentsEdit)]
        public async Task<IActionResult> Update(
            int id,
            UpdateDepartmentRequest request)
        {
            object? result =
                await _departmentService.UpdateAsync(
                    id,
                    request);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        [HasPermission(PermissionNames.DepartmentsDelete)]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted =
                await _departmentService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            return Ok(new
            {
                message =
                    "Department deactivated successfully."
            });
        }
    }
}