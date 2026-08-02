using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.DTOs.Tickets;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Interfaces;
using SupportFlow.Api.Models;
using System.Security.Claims;

namespace SupportFlow.Api.Services
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _context;
        private readonly IPermissionService _permissionService;

        public TicketService(
            AppDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

     public async Task<object> CreateAsync(
     CreateTicketRequest request,
     ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            // Get the logged-in user and their department
            ApplicationUser? currentUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(applicationUser =>
                        applicationUser.Id == userId);

            if (currentUser is null)
            {
                throw new UnauthorizedAccessException(
                    "User not found.");
            }

            if (!currentUser.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "Your account is inactive.");
            }

            // User must belong to a department
            if (!currentUser.DepartmentId.HasValue)
            {
                throw new InvalidOperationException(
                    "Your account is not assigned to a department.");
            }

            // Prevent the user from creating a ticket
            // for another department
            if (request.DepartmentId != currentUser.DepartmentId.Value)
            {
                throw new UnauthorizedAccessException(
                    "You cannot create a ticket for another department.");
            }

            // Make sure the department exists and is active
            Department? department =
                await _context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(department =>
                        department.Id ==
                            currentUser.DepartmentId.Value &&
                        department.IsActive);

            if (department is null)
            {
                throw new InvalidOperationException(
                    "Your department does not exist or is inactive.");
            }

            // Category MUST belong to the user's department
            Category? category =
                await _context.Categories
                    .AsNoTracking()
                    .FirstOrDefaultAsync(category =>
                        category.Id == request.CategoryId &&
                        category.DepartmentId ==
                            currentUser.DepartmentId.Value &&
                        category.IsActive);

            if (category is null)
            {
                throw new InvalidOperationException(
                    "The selected category does not belong to your department or is inactive.");
            }

            var ticket = new Ticket
            {
                Subject = request.Subject.Trim(),
                Description = request.Description.Trim(),
                Priority = request.Priority,
                Status = TicketStatus.New,

                CustomerId = userId,

                // Use the department from the database,
                // not blindly from React
                DepartmentId =
                    currentUser.DepartmentId.Value,

                CategoryId = category.Id,

                CreatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return new
            {
                ticket.Id,
                ticket.Subject,
                ticket.Description,

                Status = ticket.Status.ToString(),
                Priority = ticket.Priority.ToString(),

                ticket.CustomerId,

                ticket.DepartmentId,
                DepartmentName = department.Name,

                ticket.CategoryId,
                CategoryName = category.Name,

                ticket.AssignedAgentId,
                ticket.CreatedAt
            };
        }

        public async Task<object> GetAllAsync(
      TicketQueryRequest request,
      ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewDepartment =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewDepartment);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            ApplicationUser? currentUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(applicationUser =>
                        applicationUser.Id == userId);

            if (currentUser is null)
            {
                throw new UnauthorizedAccessException(
                    "User not found.");
            }

            IQueryable<Ticket> query =
                _context.Tickets.AsNoTracking();

            // --------------------------------
            // PERMISSION FILTERING
            // --------------------------------

            if (canViewAll)
            {
                // Global access.
                // User can see tickets from every department.
            }
            else if (canViewDepartment)
            {
                if (!currentUser.DepartmentId.HasValue)
                {
                    throw new UnauthorizedAccessException(
                        "Your account is not assigned to a department.");
                }

                int departmentId =
                    currentUser.DepartmentId.Value;

                query = query.Where(ticket =>
                    ticket.DepartmentId == departmentId);
            }
            else if (canViewAssigned && canViewOwn)
            {
                query = query.Where(ticket =>
                    ticket.AssignedAgentId == userId ||
                    ticket.CustomerId == userId);
            }
            else if (canViewAssigned)
            {
                query = query.Where(ticket =>
                    ticket.AssignedAgentId == userId);
            }
            else if (canViewOwn)
            {
                query = query.Where(ticket =>
                    ticket.CustomerId == userId);
            }
            else
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to view tickets.");
            }

            // --------------------------------
            // SEARCH
            // --------------------------------

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                string search =
                    request.Search.Trim();

                query = query.Where(ticket =>
                    ticket.Subject.Contains(search) ||
                    ticket.Description.Contains(search));
            }

            // --------------------------------
            // FILTERS
            // --------------------------------

            if (request.Status.HasValue)
            {
                query = query.Where(ticket =>
                    ticket.Status ==
                    request.Status.Value);
            }

            if (request.Priority.HasValue)
            {
                query = query.Where(ticket =>
                    ticket.Priority ==
                    request.Priority.Value);
            }

            if (request.DepartmentId.HasValue)
            {
                query = query.Where(ticket =>
                    ticket.DepartmentId ==
                    request.DepartmentId.Value);
            }

            if (request.CategoryId.HasValue)
            {
                query = query.Where(ticket =>
                    ticket.CategoryId ==
                    request.CategoryId.Value);
            }

            // --------------------------------
            // SORTING
            // --------------------------------

            string sortBy =
                request.SortBy?
                    .Trim()
                    .ToLowerInvariant()
                ?? "createdat";

            string sortDirection =
                request.SortDirection?
                    .Trim()
                    .ToLowerInvariant()
                ?? "desc";

            IQueryable<Ticket> sortedQuery =
                sortBy switch
                {
                    "priority" =>
                        sortDirection == "asc"
                            ? query.OrderBy(ticket =>
                                ticket.Priority)
                            : query.OrderByDescending(ticket =>
                                ticket.Priority),

                    "status" =>
                        sortDirection == "asc"
                            ? query.OrderBy(ticket =>
                                ticket.Status)
                            : query.OrderByDescending(ticket =>
                                ticket.Status),

                    "subject" =>
                        sortDirection == "asc"
                            ? query.OrderBy(ticket =>
                                ticket.Subject)
                            : query.OrderByDescending(ticket =>
                                ticket.Subject),

                    _ =>
                        sortDirection == "asc"
                            ? query.OrderBy(ticket =>
                                ticket.CreatedAt)
                            : query.OrderByDescending(ticket =>
                                ticket.CreatedAt)
                };

            // --------------------------------
            // PAGINATION
            // --------------------------------

            int page =
                request.Page < 1
                    ? 1
                    : request.Page;

            int pageSize =
                request.PageSize < 1
                    ? 10
                    : Math.Min(
                        request.PageSize,
                        100);

            int totalCount =
                await query.CountAsync();

            var tickets =
                await sortedQuery
                    .Skip(
                        (page - 1) *
                        pageSize)
                    .Take(pageSize)
                    .Select(ticket => new
                    {
                        ticket.Id,
                        ticket.Subject,
                        ticket.Description,

                        Status =
                            ticket.Status.ToString(),

                        Priority =
                            ticket.Priority.ToString(),

                        ticket.CustomerId,

                        CustomerName =
                            ticket.Customer.FullName,

                        ticket.DepartmentId,

                        DepartmentName =
                            ticket.Department.Name,

                        ticket.CategoryId,

                        CategoryName =
                            ticket.Category.Name,

                        ticket.AssignedAgentId,

                        AssignedAgentName =
                            ticket.AssignedAgent == null
                                ? null
                                : ticket.AssignedAgent.FullName,

                        ticket.CreatedAt,
                        ticket.UpdatedAt,
                        ticket.ResolvedAt,
                        ticket.ClosedAt
                    })
                    .ToListAsync();

            int totalPages =
                totalCount == 0
                    ? 0
                    : (int)Math.Ceiling(
                        totalCount /
                        (double)pageSize);

            return new
            {
                page,
                pageSize,
                totalCount,
                totalPages,
                items = tickets
            };
        }
        public async Task<object?> GetByIdAsync(
     int id,
     ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket =
                await _context.Tickets
                    .AsNoTracking()
                    .Include(ticket =>
                        ticket.Customer)
                    .Include(ticket =>
                        ticket.Department)
                    .Include(ticket =>
                        ticket.Category)
                    .Include(ticket =>
                        ticket.AssignedAgent)
                    .FirstOrDefaultAsync(ticket =>
                        ticket.Id == id);

            if (ticket is null)
            {
                return null;
            }

            ApplicationUser? currentUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(applicationUser =>
                        applicationUser.Id == userId);

            if (currentUser is null)
            {
                throw new UnauthorizedAccessException(
                    "User not found.");
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewDepartment =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewDepartment);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool ownsTicket =
                ticket.CustomerId == userId;

            bool isAssignedAgent =
                ticket.AssignedAgentId == userId;

            bool isSameDepartment =
                currentUser.DepartmentId.HasValue &&
                ticket.DepartmentId ==
                    currentUser.DepartmentId.Value;

            bool canAccess =
                canViewAll ||
                (canViewDepartment &&
                    isSameDepartment) ||
                (canViewOwn &&
                    ownsTicket) ||
                (canViewAssigned &&
                    isAssignedAgent);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to view this ticket.");
            }

            return new
            {
                ticket.Id,
                ticket.Subject,
                ticket.Description,

                Status =
                    ticket.Status.ToString(),

                Priority =
                    ticket.Priority.ToString(),

                ticket.CustomerId,

                CustomerName =
                    ticket.Customer.FullName,

                CustomerEmail =
                    ticket.Customer.Email,

                ticket.DepartmentId,

                DepartmentName =
                    ticket.Department.Name,

                ticket.CategoryId,

                CategoryName =
                    ticket.Category.Name,

                ticket.AssignedAgentId,

                AssignedAgentName =
                    ticket.AssignedAgent?.FullName,

                ticket.CreatedAt,
                ticket.UpdatedAt,
                ticket.ResolvedAt,
                ticket.ClosedAt
            };
        }

        private static int GetUserId(
            ClaimsPrincipal user)
        {
            string? userIdValue = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out int userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid authentication token.");
            }

            return userId;
        }


        public async Task<object?> AssignAsync(
    int ticketId,
    AssignTicketRequest request)
        {
            Ticket? ticket = await _context.Tickets
                .FirstOrDefaultAsync(ticket =>
                    ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            ApplicationUser? agent = await _context.Users
                .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
                .FirstOrDefaultAsync(user =>
                    user.Id == request.AgentId &&
                    user.IsActive);

            if (agent is null)
            {
                throw new InvalidOperationException(
                    "The selected user does not exist or is inactive.");
            }

            bool canBeAssigned = agent.UserRoles.Any(userRole =>
                userRole.Role.Name == "Agent" ||
                userRole.Role.Name == "Supervisor" ||
                userRole.Role.Name == "Admin");

            if (!canBeAssigned)
            {
                throw new InvalidOperationException(
                    "The selected user cannot be assigned to tickets.");
            }

            ticket.AssignedAgentId = agent.Id;
            ticket.Status = TicketStatus.InProgress;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new
            {
                ticket.Id,
                ticket.AssignedAgentId,
                AssignedAgentName = agent.FullName,
                Status = ticket.Status.ToString(),
                ticket.UpdatedAt
            };
        }



        public async Task<object?> ChangeStatusAsync(
    int ticketId,
    ChangeTicketStatusRequest request)
        {
            Ticket? ticket = await _context.Tickets
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            DateTime now = DateTime.UtcNow;

            ticket.Status = request.Status;
            ticket.UpdatedAt = now;

            if (request.Status == TicketStatus.Resolved)
            {
                ticket.ResolvedAt = now;
                ticket.ClosedAt = null;
            }
            else if (request.Status == TicketStatus.Closed)
            {
                ticket.ClosedAt = now;
            }
            else
            {
                ticket.ResolvedAt = null;
                ticket.ClosedAt = null;
            }

            await _context.SaveChangesAsync();

            return new
            {
                ticket.Id,
                Status = ticket.Status.ToString(),
                ticket.UpdatedAt,
                ticket.ResolvedAt,
                ticket.ClosedAt
            };
        }



        public async Task<object?> AddMessageAsync(
    int ticketId,
    CreateTicketMessageRequest request,
    ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket = await _context.Tickets
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool ownsTicket = ticket.CustomerId == userId;

            bool isAssignedAgent =
                ticket.AssignedAgentId == userId;

            bool canAccess =
                canViewAll ||
                (canViewOwn && ownsTicket) ||
                (canViewAssigned && isAssignedAgent);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to access this ticket.");
            }

            if (request.IsInternalNote &&
                !canViewAll &&
                !canViewAssigned)
            {
                throw new UnauthorizedAccessException(
                    "You cannot create internal notes.");
            }

            var message = new TicketMessage
            {
                TicketId = ticket.Id,
                SenderId = userId,
                Message = request.Message.Trim(),
                IsInternalNote = request.IsInternalNote,
                CreatedAt = DateTime.UtcNow
            };

            ticket.UpdatedAt = DateTime.UtcNow;

            _context.TicketMessages.Add(message);
            await _context.SaveChangesAsync();

            return new
            {
                message.Id,
                message.TicketId,
                message.SenderId,
                message.Message,
                message.IsInternalNote,
                message.CreatedAt
            };
        }



        public async Task<object?> GetMessagesAsync(
            int ticketId,
            ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket = await _context.Tickets
                .AsNoTracking()
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool ownsTicket = ticket.CustomerId == userId;

            bool isAssignedAgent =
                ticket.AssignedAgentId == userId;

            bool canAccess =
                canViewAll ||
                (canViewOwn && ownsTicket) ||
                (canViewAssigned && isAssignedAgent);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to access this ticket.");
            }

            bool canSeeInternalNotes =
                canViewAll || canViewAssigned;

            return await _context.TicketMessages
                .AsNoTracking()
                .Where(message =>
                    message.TicketId == ticketId &&
                    (canSeeInternalNotes || !message.IsInternalNote))
                .OrderBy(message => message.CreatedAt)
                .Select(message => new
                {
                    message.Id,
                    message.TicketId,
                    message.SenderId,
                    SenderName = message.Sender.FullName,
                    message.Message,
                    message.IsInternalNote,
                    message.CreatedAt
                })
                .ToListAsync();
        }




        public async Task<object?> UploadAttachmentAsync(
    int ticketId,
    UploadTicketAttachmentRequest request,
    ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket = await _context.Tickets
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool ownsTicket = ticket.CustomerId == userId;

            bool isAssignedAgent =
                ticket.AssignedAgentId == userId;

            bool canAccess =
                canViewAll ||
                (canViewOwn && ownsTicket) ||
                (canViewAssigned && isAssignedAgent);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to access this ticket.");
            }

            IFormFile file = request.File;

            if (file.Length == 0)
            {
                throw new InvalidOperationException(
                    "The selected file is empty.");
            }

            const long maximumFileSize = 5 * 1024 * 1024;

            if (file.Length > maximumFileSize)
            {
                throw new InvalidOperationException(
                    "The maximum file size is 5 MB.");
            }

            string[] allowedExtensions =
            {
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".doc",
        ".docx",
        ".txt"
    };

            string extension = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                throw new InvalidOperationException(
                    "This file type is not allowed.");
            }

            string uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                "tickets",
                ticket.Id.ToString()
            );

            Directory.CreateDirectory(uploadsFolder);

            string storedFileName =
                $"{Guid.NewGuid():N}{extension}";

            string physicalPath = Path.Combine(
                uploadsFolder,
                storedFileName
            );

            await using (FileStream stream = new(
                physicalPath,
                FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            string relativePath =
                $"/uploads/tickets/{ticket.Id}/{storedFileName}";

            var attachment = new TicketAttachment
            {
                TicketId = ticket.Id,
                UploadedById = userId,
                FileName = Path.GetFileName(file.FileName),
                FilePath = relativePath,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow
            };

            ticket.UpdatedAt = DateTime.UtcNow;

            _context.TicketAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            return new
            {
                attachment.Id,
                attachment.TicketId,
                attachment.UploadedById,
                attachment.FileName,
                attachment.FilePath,
                attachment.ContentType,
                attachment.FileSize,
                attachment.UploadedAt
            };
        }



        public async Task<object?> GetAttachmentsAsync(
    int ticketId,
    ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket = await _context.Tickets
                .AsNoTracking()
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool canViewOwn =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewOwn);

            bool canViewAssigned =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAssigned);

            bool ownsTicket = ticket.CustomerId == userId;

            bool isAssignedAgent =
                ticket.AssignedAgentId == userId;

            bool canAccess =
                canViewAll ||
                (canViewOwn && ownsTicket) ||
                (canViewAssigned && isAssignedAgent);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to access this ticket.");
            }

            return await _context.TicketAttachments
                .AsNoTracking()
                .Where(attachment =>
                    attachment.TicketId == ticketId)
                .OrderByDescending(attachment =>
                    attachment.UploadedAt)
                .Select(attachment => new
                {
                    attachment.Id,
                    attachment.TicketId,
                    attachment.UploadedById,
                    UploadedByName =
                        attachment.UploadedBy.FullName,
                    attachment.FileName,
                    attachment.FilePath,
                    attachment.ContentType,
                    attachment.FileSize,
                    attachment.UploadedAt
                })
                .ToListAsync();
        }



        public async Task<object?> DeleteAttachmentAsync(
    int ticketId,
    int attachmentId,
    ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            Ticket? ticket = await _context.Tickets
                .AsNoTracking()
                .FirstOrDefaultAsync(ticket => ticket.Id == ticketId);

            if (ticket is null)
            {
                return null;
            }

            TicketAttachment? attachment =
                await _context.TicketAttachments
                    .FirstOrDefaultAsync(attachment =>
                        attachment.Id == attachmentId &&
                        attachment.TicketId == ticketId);

            if (attachment is null)
            {
                throw new InvalidOperationException(
                    "Attachment not found.");
            }

            bool canViewAll =
                await _permissionService.HasPermissionAsync(
                    userId,
                    PermissionNames.TicketsViewAll);

            bool ownsTicket =
                ticket.CustomerId == userId;

            bool uploadedTheFile =
                attachment.UploadedById == userId;

            bool canDelete =
                canViewAll ||
                (ownsTicket && uploadedTheFile);

            if (!canDelete)
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to delete this attachment.");
            }

            string relativePath =
                attachment.FilePath.TrimStart('/');

            string physicalPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                relativePath.Replace(
                    '/',
                    Path.DirectorySeparatorChar)
            );

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            _context.TicketAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return new
            {
                message = "Attachment deleted successfully.",
                attachmentId = attachment.Id
            };
        }


        public async Task<object> GetCreateTicketCategoriesAsync(
    ClaimsPrincipal user)
        {
            int userId = GetUserId(user);

            ApplicationUser? currentUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(user =>
                        user.Id == userId);

            if (currentUser is null)
            {
                throw new UnauthorizedAccessException(
                    "User not found.");
            }

            if (!currentUser.DepartmentId.HasValue)
            {
                return Array.Empty<object>();
            }

            int departmentId =
                currentUser.DepartmentId.Value;

            return await _context.Categories
                .AsNoTracking()
                .Where(category =>
                    category.DepartmentId == departmentId &&
                    category.IsActive)
                .OrderBy(category => category.Name)
                .Select(category => new
                {
                    category.Id,
                    category.Name,
                    category.Description,
                    category.DepartmentId
                })
                .ToListAsync();
        }


    }

}