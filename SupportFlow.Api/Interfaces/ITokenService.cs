using SupportFlow.Api.Models;

namespace SupportFlow.Api.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(ApplicationUser user);
    }
}