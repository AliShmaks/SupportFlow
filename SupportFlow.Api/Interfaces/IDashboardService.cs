namespace SupportFlow.Api.Interfaces
{
    public interface IDashboardService
    {
        Task<object> GetSummaryAsync();
    }
}