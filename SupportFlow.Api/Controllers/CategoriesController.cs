using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Api.DTOs.Categories;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Interfaces;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(
            ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        [HasPermission(PermissionNames.CategoriesView)]
        public async Task<IActionResult> GetAll()
        {
            object result =
                await _categoryService.GetAllAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [HasPermission(PermissionNames.CategoriesView)]
        public async Task<IActionResult> GetById(int id)
        {
            object? result =
                await _categoryService.GetByIdAsync(id);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(result);
        }

        [HttpPost]
        [HasPermission(PermissionNames.CategoriesCreate)]
        public async Task<IActionResult> Create(
            CreateCategoryRequest request)
        {
            object result =
                await _categoryService.CreateAsync(request);

            return Created(string.Empty, result);
        }

        [HttpPut("{id:int}")]
        [HasPermission(PermissionNames.CategoriesEdit)]
        public async Task<IActionResult> Update(
            int id,
            UpdateCategoryRequest request)
        {
            object? result =
                await _categoryService.UpdateAsync(
                    id,
                    request);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        [HasPermission(PermissionNames.CategoriesDelete)]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted =
                await _categoryService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(new
            {
                message =
                    "Category deactivated successfully."
            });
        }
    }
}