using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Ticket> Tickets => Set<Ticket>();
        public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
        public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // Unique indexes
            // =========================
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(user => user.Department)
                .WithMany(department => department.Users)
                .HasForeignKey(user => user.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<TicketAttachment>()
                .HasOne(attachment => attachment.Ticket)
                .WithMany(ticket => ticket.Attachments)
                .HasForeignKey(attachment => attachment.TicketId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TicketAttachment>()
                .HasOne(attachment => attachment.UploadedBy)
                .WithMany(user => user.UploadedAttachments)
                .HasForeignKey(attachment => attachment.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<TicketMessage>()
                .HasOne(message => message.Ticket)
                .WithMany(ticket => ticket.Messages)
                .HasForeignKey(message => message.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TicketMessage>()
                .HasOne(message => message.Sender)
                .WithMany(user => user.SentMessages)
                .HasForeignKey(message => message.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Ticket>()
                .HasOne(ticket => ticket.Department)
                .WithMany(department => department.Tickets)
                .HasForeignKey(ticket => ticket.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ticket>()
                .HasOne(ticket => ticket.Category)
                .WithMany(category => category.Tickets)
                .HasForeignKey(ticket => ticket.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<ApplicationUser>()
                .HasIndex(user => user.Email)
                .IsUnique();

            modelBuilder.Entity<Role>()
                .HasIndex(role => role.Name)
                .IsUnique();

            modelBuilder.Entity<Permission>()
                .HasIndex(permission => permission.Name)
                .IsUnique();

            modelBuilder.Entity<Department>()
                .HasIndex(department => department.Name)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasIndex(category => new
                {
                    category.DepartmentId,
                    category.Name
                })
                .IsUnique();

            // =========================
            // User roles
            // =========================

            modelBuilder.Entity<UserRole>()
                .HasKey(userRole => new
                {
                    userRole.UserId,
                    userRole.RoleId
                });

            modelBuilder.Entity<UserRole>()
                .HasOne(userRole => userRole.User)
                .WithMany(user => user.UserRoles)
                .HasForeignKey(userRole => userRole.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserRole>()
                .HasOne(userRole => userRole.Role)
                .WithMany(role => role.UserRoles)
                .HasForeignKey(userRole => userRole.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Role permissions
            // =========================

            modelBuilder.Entity<RolePermission>()
                .HasKey(rolePermission => new
                {
                    rolePermission.RoleId,
                    rolePermission.PermissionId
                });

            modelBuilder.Entity<RolePermission>()
                .HasOne(rolePermission => rolePermission.Role)
                .WithMany(role => role.RolePermissions)
                .HasForeignKey(rolePermission => rolePermission.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RolePermission>()
                .HasOne(rolePermission => rolePermission.Permission)
                .WithMany(permission => permission.RolePermissions)
                .HasForeignKey(rolePermission => rolePermission.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Department categories
            // =========================

            modelBuilder.Entity<Category>()
                .HasOne(category => category.Department)
                .WithMany(department => department.Categories)
                .HasForeignKey(category => category.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // =========================
            // Ticket relationships
            // =========================

            modelBuilder.Entity<Ticket>()
                .HasOne(ticket => ticket.Customer)
                .WithMany(user => user.CreatedTickets)
                .HasForeignKey(ticket => ticket.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ticket>()
                .HasOne(ticket => ticket.AssignedAgent)
                .WithMany(user => user.AssignedTickets)
                .HasForeignKey(ticket => ticket.AssignedAgentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ticket>()
                .Property(ticket => ticket.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Ticket>()
                .Property(ticket => ticket.Priority)
                .HasConversion<string>();

            // =========================
            // Seed roles
            // =========================

            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = 1,
                    Name = "Customer",
                    Description = "Customer who creates and follows their own tickets.",
                    IsSystemRole = true
                },
                new Role
                {
                    Id = 2,
                    Name = "Agent",
                    Description = "Support employee who handles assigned tickets.",
                    IsSystemRole = true
                },
                new Role
                {
                    Id = 3,
                    Name = "Supervisor",
                    Description = "Supervisor who assigns and manages tickets.",
                    IsSystemRole = true
                },
                new Role
                {
                    Id = 4,
                    Name = "Admin",
                    Description = "Administrator with full system access.",
                    IsSystemRole = true
                }
            );

            // =========================
            // Seed permissions
            // =========================

            modelBuilder.Entity<Permission>().HasData(
                new Permission
                {
                    Id = 1,
                    Name = "Tickets.Create",
                    Description = "Create new tickets."
                },
                new Permission
                {
                    Id = 2,
                    Name = "Tickets.ViewOwn",
                    Description = "View tickets created by the current user."
                },
                new Permission
                {
                    Id = 3,
                    Name = "Tickets.ViewAssigned",
                    Description = "View tickets assigned to the current agent."
                },
                new Permission
                {
                    Id = 4,
                    Name = "Tickets.ViewAll",
                    Description = "View all tickets."
                },
                new Permission
                {
                    Id = 5,
                    Name = "Tickets.Reply",
                    Description = "Reply to tickets."
                },
                new Permission
                {
                    Id = 6,
                    Name = "Tickets.Assign",
                    Description = "Assign tickets to agents."
                },
                new Permission
                {
                    Id = 7,
                    Name = "Tickets.ChangeStatus",
                    Description = "Change ticket status."
                },
                new Permission
                {
                    Id = 8,
                    Name = "Tickets.Close",
                    Description = "Close tickets."
                },
                new Permission
                {
                    Id = 9,
                    Name = "Users.Manage",
                    Description = "Manage system users."
                },
                new Permission
                {
                    Id = 10,
                    Name = "Roles.Manage",
                    Description = "Manage roles and permissions."
                },
                new Permission
                {
                    Id = 11,
                    Name = "Reports.View",
                    Description = "View reports and analytics."
                }
            );

            // =========================
            // Seed role permissions
            // =========================

            modelBuilder.Entity<RolePermission>().HasData(
                // Customer
                new RolePermission { RoleId = 1, PermissionId = 1 },
                new RolePermission { RoleId = 1, PermissionId = 2 },
                new RolePermission { RoleId = 1, PermissionId = 5 },
                new RolePermission { RoleId = 1, PermissionId = 8 },

                // Agent
                new RolePermission { RoleId = 2, PermissionId = 3 },
                new RolePermission { RoleId = 2, PermissionId = 5 },
                new RolePermission { RoleId = 2, PermissionId = 7 },

                // Supervisor
                new RolePermission { RoleId = 3, PermissionId = 3 },
                new RolePermission { RoleId = 3, PermissionId = 4 },
                new RolePermission { RoleId = 3, PermissionId = 5 },
                new RolePermission { RoleId = 3, PermissionId = 6 },
                new RolePermission { RoleId = 3, PermissionId = 7 },
                new RolePermission { RoleId = 3, PermissionId = 8 },
                new RolePermission { RoleId = 3, PermissionId = 11 },

                // Admin
                new RolePermission { RoleId = 4, PermissionId = 1 },
                new RolePermission { RoleId = 4, PermissionId = 2 },
                new RolePermission { RoleId = 4, PermissionId = 3 },
                new RolePermission { RoleId = 4, PermissionId = 4 },
                new RolePermission { RoleId = 4, PermissionId = 5 },
                new RolePermission { RoleId = 4, PermissionId = 6 },
                new RolePermission { RoleId = 4, PermissionId = 7 },
                new RolePermission { RoleId = 4, PermissionId = 8 },
                new RolePermission { RoleId = 4, PermissionId = 9 },
                new RolePermission { RoleId = 4, PermissionId = 10 },
                new RolePermission { RoleId = 4, PermissionId = 11 }
            );
        }
    }
}