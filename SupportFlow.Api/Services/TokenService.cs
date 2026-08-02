using Microsoft.IdentityModel.Tokens;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SupportFlow.Api.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreateToken(ApplicationUser user)
        {
            string jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key is missing.");

            string? issuer = _configuration["Jwt:Issuer"];
            string? audience = _configuration["Jwt:Audience"];

            var claims = new List<Claim>
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    user.Id.ToString()
                ),

                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    user.FullName
                ),

                new Claim(
                    ClaimTypes.Email,
                    user.Email
                )
            };

            foreach (UserRole userRole in user.UserRoles)
            {
                claims.Add(
                    new Claim(
                        ClaimTypes.Role,
                        userRole.Role.Name
                    )
                );
            }

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256
            );

            int expirationMinutes =
                _configuration.GetValue<int?>("Jwt:ExpiresMinutes") ?? 120;

            var tokenDescriptor = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(tokenDescriptor);
        }
    }
}