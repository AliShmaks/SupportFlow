using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Users;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<ApplicationUser> _passwordHasher;

        public UsersController(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<ApplicationUser>();
        }

        // CREATE USER
        [HttpPost]
        [HasPermission(PermissionNames.UsersCreate)]
        public async Task<IActionResult> Create(
            CreateUserRequest request)
        {
            string normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            bool emailExists = await _context.Users
                .AnyAsync(user =>
                    user.Email == normalizedEmail);

            if (emailExists)
            {
                return Conflict(new
                {
                    message =
                        "A user with this email already exists."
                });
            }

            Department? department = null;

            if (request.DepartmentId.HasValue)
            {
                department = await _context.Departments
                    .FirstOrDefaultAsync(department =>
                        department.Id ==
                            request.DepartmentId.Value &&
                        department.IsActive);

                if (department is null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected department is invalid or inactive."
                    });
                }
            }

            List<int> requestedRoleIds =
                request.RoleIds
                    .Distinct()
                    .ToList();

            List<Role> roles = await _context.Roles
                .Where(role =>
                    requestedRoleIds.Contains(role.Id))
                .ToListAsync();

            if (roles.Count != requestedRoleIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more selected roles are invalid."
                });
            }

            var user = new ApplicationUser
            {
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                DepartmentId = request.DepartmentId,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password
                );

            foreach (Role role in roles)
            {
                user.UserRoles.Add(
                    new UserRole
                    {
                        RoleId = role.Id,
                        AssignedAt = DateTime.UtcNow
                    });
            }

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Created(
                string.Empty,
                new
                {
                    user.Id,
                    user.FullName,
                    user.Email,

                    user.DepartmentId,

                    DepartmentName =
                        department?.Name,

                    user.IsActive,
                    user.CreatedAt,

                    Roles = roles
                        .Select(role => new
                        {
                            role.Id,
                            role.Name
                        })
                        .ToList()
                });
        }

        // AGENTS FOR TICKET ASSIGNMENT
        [HttpGet("agents")]
        public async Task<IActionResult> GetAgents()
        {
            var agents = await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.IsActive &&
                    user.UserRoles.Any(userRole =>
                        userRole.Role.Name == "Agent" ||
                        userRole.Role.Name == "Supervisor" ||
                        userRole.Role.Name == "Admin"
                    )
                )
                .OrderBy(user => user.FullName)
                .Select(user => new
                {
                    user.Id,
                    user.FullName,
                    user.Email,

                    user.DepartmentId,

                    DepartmentName =
                        user.Department == null
                            ? null
                            : user.Department.Name,

                    Roles = user.UserRoles
                        .Select(userRole =>
                            userRole.Role.Name)
                        .ToList()
                })
                .ToListAsync();

            return Ok(agents);
        }

        // ALL USERS
        [HttpGet]
        [HasPermission(PermissionNames.UsersView)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .AsNoTracking()
                .OrderBy(user => user.FullName)
                .Select(user => new
                {
                    user.Id,
                    user.FullName,
                    user.Email,

                    user.DepartmentId,

                    DepartmentName =
                        user.Department == null
                            ? null
                            : user.Department.Name,

                    user.IsActive,
                    user.CreatedAt,

                    Roles = user.UserRoles
                        .Select(userRole => new
                        {
                            userRole.Role.Id,
                            userRole.Role.Name
                        })
                        .OrderBy(role => role.Name)
                        .ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        // AVAILABLE ROLES
        [HttpGet("roles")]
        [HasPermission(PermissionNames.UsersView)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .OrderBy(role => role.Name)
                .Select(role => new
                {
                    role.Id,
                    role.Name,
                    role.Description,
                    role.IsSystemRole
                })
                .ToListAsync();

            return Ok(roles);
        }

        // UPDATE USER ROLES
        [HttpPut("{id:int}/roles")]
        [HasPermission(PermissionNames.UsersEditRoles)]
        public async Task<IActionResult> UpdateRoles(
            int id,
            UpdateUserRolesRequest request)
        {
            ApplicationUser? user =
                await _context.Users
                    .Include(user => user.UserRoles)
                    .FirstOrDefaultAsync(user =>
                        user.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            List<int> requestedRoleIds =
                request.RoleIds
                    .Distinct()
                    .ToList();

            List<int> validRoleIds =
                await _context.Roles
                    .Where(role =>
                        requestedRoleIds.Contains(role.Id))
                    .Select(role => role.Id)
                    .ToListAsync();

            if (validRoleIds.Count != requestedRoleIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more selected roles are invalid."
                });
            }

            _context.UserRoles.RemoveRange(
                user.UserRoles);

            foreach (int roleId in validRoleIds)
            {
                user.UserRoles.Add(
                    new UserRole
                    {
                        UserId = user.Id,
                        RoleId = roleId,
                        AssignedAt = DateTime.UtcNow
                    });
            }

            await _context.SaveChangesAsync();

            var roles = await _context.UserRoles
                .AsNoTracking()
                .Where(userRole =>
                    userRole.UserId == user.Id)
                .Select(userRole => new
                {
                    userRole.Role.Id,
                    userRole.Role.Name
                })
                .OrderBy(role => role.Name)
                .ToListAsync();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                Roles = roles
            });
        }

        // ACTIVATE / DEACTIVATE USER
        [HttpPut("{id:int}/active")]
        [HasPermission(PermissionNames.UsersChangeStatus)]
        public async Task<IActionResult> SetActive(
            int id,
            SetUserActiveRequest request)
        {
            ApplicationUser? user =
                await _context.Users
                    .FirstOrDefaultAsync(user =>
                        user.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.IsActive
            });
        }

        [HttpPut("{id:int}")]
        [HasPermission(PermissionNames.UsersEdit)]
        public async Task<IActionResult> UpdateUser(
    int id,
    UpdateUserRequest request)
        {
            ApplicationUser? user = await _context.Users
                .Include(user => user.UserRoles)
                .FirstOrDefaultAsync(user => user.Id == id);

            if (user is null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            string normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            bool emailExists = await _context.Users
                .AnyAsync(otherUser =>
                    otherUser.Id != id &&
                    otherUser.Email == normalizedEmail);

            if (emailExists)
            {
                return Conflict(new
                {
                    message =
                        "Another user already uses this email."
                });
            }

            Department? department = null;

            if (request.DepartmentId.HasValue)
            {
                department = await _context.Departments
                    .FirstOrDefaultAsync(department =>
                        department.Id == request.DepartmentId.Value &&
                        department.IsActive);

                if (department is null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected department is invalid or inactive."
                    });
                }
            }

            List<int> requestedRoleIds =
                request.RoleIds
                    .Distinct()
                    .ToList();

            List<Role> roles = await _context.Roles
                .Where(role =>
                    requestedRoleIds.Contains(role.Id))
                .ToListAsync();

            if (roles.Count != requestedRoleIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more selected roles are invalid."
                });
            }

            user.FullName = request.FullName.Trim();
            user.Email = normalizedEmail;
            user.DepartmentId = request.DepartmentId;
            user.IsActive = request.IsActive;

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                user.PasswordHash =
                    _passwordHasher.HashPassword(
                        user,
                        request.NewPassword
                    );
            }

            _context.UserRoles.RemoveRange(user.UserRoles);

            foreach (Role role in roles)
            {
                user.UserRoles.Add(
                    new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id,
                        AssignedAt = DateTime.UtcNow
                    });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.DepartmentId,
                DepartmentName = department?.Name,
                user.IsActive,

                Roles = roles
                    .Select(role => new
                    {
                        role.Id,
                        role.Name
                    })
                    .OrderBy(role => role.Name)
                    .ToList()
            });
        }


    }
}