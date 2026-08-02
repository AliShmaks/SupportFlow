using SupportFlow.Api.DTOs.Departments;

namespace SupportFlow.Api.Interfaces
{
    public interface IDepartmentService
    {
        Task<object> GetAllAsync();

        Task<object?> GetByIdAsync(int id);

        Task<object> CreateAsync(
            CreateDepartmentRequest request);


        Task<object?> UpdateAsync(
            int id,
            UpdateDepartmentRequest request);

        Task<bool> DeleteAsync(int id);
    }
}