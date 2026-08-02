using SupportFlow.Api.DTOs.Categories;

namespace SupportFlow.Api.Interfaces
{
    public interface ICategoryService
    {
        Task<object> GetAllAsync();

        Task<object?> GetByIdAsync(int id);

        Task<object> CreateAsync(
            CreateCategoryRequest request);


        Task<object?> UpdateAsync(
            int id,
            UpdateCategoryRequest request);

        Task<bool> DeleteAsync(int id);
    }
}