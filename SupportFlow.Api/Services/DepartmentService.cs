using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Departments;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly AppDbContext _context;

        public DepartmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAllAsync()
        {
            return await _context.Departments
                .AsNoTracking()
                .OrderBy(department => department.Name)
                .Select(department => new
                {
                    department.Id,
                    department.Name,
                    department.Description,
                    department.IsActive,
                    department.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<object?> GetByIdAsync(int id)
        {
            return await _context.Departments
                .AsNoTracking()
                .Where(department => department.Id == id)
                .Select(department => new
                {
                    department.Id,
                    department.Name,
                    department.Description,
                    department.IsActive,
                    department.CreatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<object> CreateAsync(
            CreateDepartmentRequest request)
        {
            string normalizedName = request.Name.Trim();

            bool alreadyExists = await _context.Departments
                .AnyAsync(department =>
                    department.Name == normalizedName);

            if (alreadyExists)
            {
                throw new InvalidOperationException(
                    "A department with this name already exists.");
            }

            var department = new Department
            {
                Name = normalizedName,
                Description = request.Description?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return new
            {
                department.Id,
                department.Name,
                department.Description,
                department.IsActive,
                department.CreatedAt
            };
        }


        public async Task<object?> UpdateAsync(
    int id,
    UpdateDepartmentRequest request)
        {
            Department? department = await _context.Departments
                .FirstOrDefaultAsync(department => department.Id == id);

            if (department is null)
            {
                return null;
            }

            string normalizedName = request.Name.Trim();

            bool nameAlreadyExists = await _context.Departments
                .AnyAsync(otherDepartment =>
                    otherDepartment.Id != id &&
                    otherDepartment.Name == normalizedName);

            if (nameAlreadyExists)
            {
                throw new InvalidOperationException(
                    "Another department already uses this name.");
            }

            department.Name = normalizedName;
            department.Description = request.Description?.Trim();
            department.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return new
            {
                department.Id,
                department.Name,
                department.Description,
                department.IsActive,
                department.CreatedAt
            };
        }



        public async Task<bool> DeleteAsync(int id)
        {
            Department? department = await _context.Departments
                .FirstOrDefaultAsync(department => department.Id == id);

            if (department is null)
            {
                return false;
            }

            department.IsActive = false;

            await _context.SaveChangesAsync();

            return true;
        }

    }
}