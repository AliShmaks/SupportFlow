using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Categories;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;

        public CategoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAllAsync()
        {
            return await _context.Categories
                .AsNoTracking()
                .OrderBy(category => category.Name)
                .Select(category => new
                {
                    category.Id,
                    category.Name,
                    category.Description,
                    category.IsActive,
                    category.DepartmentId,
                    DepartmentName = category.Department.Name,
                    category.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<object?> GetByIdAsync(int id)
        {
            return await _context.Categories
                .AsNoTracking()
                .Where(category => category.Id == id)
                .Select(category => new
                {
                    category.Id,
                    category.Name,
                    category.Description,
                    category.IsActive,
                    category.DepartmentId,
                    DepartmentName = category.Department.Name,
                    category.CreatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<object> CreateAsync(
            CreateCategoryRequest request)
        {
            Department? department = await _context.Departments
                .FirstOrDefaultAsync(department =>
                    department.Id == request.DepartmentId &&
                    department.IsActive);

            if (department is null)
            {
                throw new InvalidOperationException(
                    "The selected department does not exist or is inactive.");
            }

            string normalizedName = request.Name.Trim();

            bool alreadyExists = await _context.Categories
                .AnyAsync(category =>
                    category.DepartmentId == request.DepartmentId &&
                    category.Name == normalizedName);

            if (alreadyExists)
            {
                throw new InvalidOperationException(
                    "This category already exists in the selected department.");
            }

            var category = new Category
            {
                Name = normalizedName,
                Description = request.Description?.Trim(),
                DepartmentId = request.DepartmentId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return new
            {
                category.Id,
                category.Name,
                category.Description,
                category.IsActive,
                category.DepartmentId,
                DepartmentName = department.Name,
                category.CreatedAt
            };
        }


        public async Task<object?> UpdateAsync(
    int id,
    UpdateCategoryRequest request)
        {
            Category? category = await _context.Categories
                .FirstOrDefaultAsync(category => category.Id == id);

            if (category is null)
            {
                return null;
            }

            Department? department = await _context.Departments
                .FirstOrDefaultAsync(department =>
                    department.Id == request.DepartmentId);

            if (department is null)
            {
                throw new InvalidOperationException(
                    "The selected department does not exist.");
            }

            string normalizedName = request.Name.Trim();

            bool nameAlreadyExists = await _context.Categories
                .AnyAsync(otherCategory =>
                    otherCategory.Id != id &&
                    otherCategory.DepartmentId == request.DepartmentId &&
                    otherCategory.Name == normalizedName);

            if (nameAlreadyExists)
            {
                throw new InvalidOperationException(
                    "Another category with this name already exists in the selected department.");
            }

            category.Name = normalizedName;
            category.Description = request.Description?.Trim();
            category.DepartmentId = request.DepartmentId;
            category.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return new
            {
                category.Id,
                category.Name,
                category.Description,
                category.IsActive,
                category.DepartmentId,
                DepartmentName = department.Name,
                category.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Category? category = await _context.Categories
                .FirstOrDefaultAsync(category => category.Id == id);

            if (category is null)
            {
                return false;
            }

            category.IsActive = false;

            await _context.SaveChangesAsync();

            return true;
        }



    }
}