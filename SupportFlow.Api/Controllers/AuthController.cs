using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Auth;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<ApplicationUser> _passwordHasher;

        public AuthController(
            AppDbContext context,
            ITokenService tokenService,
            IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<ApplicationUser>();
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(
            RegisterRequest request)
        {
            string normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            bool emailExists = await _context.Users
                .AnyAsync(user => user.Email == normalizedEmail);

            if (emailExists)
            {
                return Conflict(new
                {
                    message = "An account with this email already exists."
                });
            }

            Role? customerRole = await _context.Roles
                .FirstOrDefaultAsync(role => role.Name == "Customer");

            if (customerRole is null)
            {
                return StatusCode(500, new
                {
                    message = "Customer role was not found."
                });
            }

            var user = new ApplicationUser
            {
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                request.Password
            );

            user.UserRoles.Add(new UserRole
            {
                User = user,
                Role = customerRole,
                AssignedAt = DateTime.UtcNow
            });

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            string token = _tokenService.CreateToken(user);

            return Ok(CreateAuthResponse(user, token));
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(
            LoginRequest request)
        {
            string normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            ApplicationUser? user = await _context.Users
                .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
                .FirstOrDefaultAsync(user =>
                    user.Email == normalizedEmail);

            if (user is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message = "This account is disabled."
                });
            }

            PasswordVerificationResult result =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password
                );

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            string token = _tokenService.CreateToken(user);

            return Ok(CreateAuthResponse(user, token));
        }




        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            string? userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                userIdValue,
                out int userId))
            {
                return Unauthorized(new
                {
                    message = "Invalid token."
                });
            }

            ApplicationUser? user =
                await _context.Users
                    .Include(user => user.Department)
                    .Include(user => user.UserRoles)
                    .ThenInclude(userRole => userRole.Role)
                    .ThenInclude(role => role.RolePermissions)
                    .ThenInclude(rolePermission =>
                        rolePermission.Permission)
                    .FirstOrDefaultAsync(user =>
                        user.Id == userId);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var roles = user.UserRoles
                .Select(userRole =>
                    userRole.Role.Name)
                .Distinct()
                .OrderBy(role => role)
                .ToList();

            var permissions = user.UserRoles
                .SelectMany(userRole =>
                    userRole.Role.RolePermissions)
                .Select(rolePermission =>
                    rolePermission.Permission.Name)
                .Distinct()
                .OrderBy(permission =>
                    permission)
                .ToList();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,

                user.DepartmentId,

                DepartmentName =
                    user.Department?.Name,

                Roles = roles,
                Permissions = permissions
            });
        }


        private AuthResponse CreateAuthResponse(
            ApplicationUser user,
            string token)
        {
            int expirationMinutes =
                _configuration.GetValue<int?>(
                    "Jwt:ExpiresMinutes"
                ) ?? 120;

            return new AuthResponse
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,

                Roles = user.UserRoles
                    .Select(userRole => userRole.Role.Name)
                    .ToList(),

                ExpiresAt = DateTime.UtcNow
                    .AddMinutes(expirationMinutes)
            };
        }
    }
}