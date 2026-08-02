namespace SupportFlow.Api.Helpers
{
    public static class PermissionNames
    {
        // Dashboard
        public const string DashboardView =
            "Dashboard.View";

        // Tickets
        public const string TicketsViewOwn =
            "Tickets.ViewOwn";

        public const string TicketsViewAssigned =
            "Tickets.ViewAssigned";

        public const string TicketsViewDepartment =
            "Tickets.ViewDepartment";

        public const string TicketsViewAll =
            "Tickets.ViewAll";

        public const string TicketsCreate =
            "Tickets.Create";

        public const string TicketsReply =
            "Tickets.Reply";

        public const string TicketsAssign =
            "Tickets.Assign";

        public const string TicketsChangeStatus =
            "Tickets.ChangeStatus";

        // Departments
        public const string DepartmentsView =
            "Departments.View";

        public const string DepartmentsCreate =
            "Departments.Create";

        public const string DepartmentsEdit =
            "Departments.Edit";

        public const string DepartmentsDelete =
            "Departments.Delete";

        // Categories
        public const string CategoriesView =
            "Categories.View";

        public const string CategoriesCreate =
            "Categories.Create";

        public const string CategoriesEdit =
            "Categories.Edit";

        public const string CategoriesDelete =
            "Categories.Delete";

        // Users
        public const string UsersView =
            "Users.View";

        public const string UsersCreate =
            "Users.Create";

        public const string UsersEdit =
            "Users.Edit";

        public const string UsersEditRoles =
            "Users.EditRoles";

        public const string UsersChangeStatus =
            "Users.ChangeStatus";

        // Roles
        public const string RolesView =
            "Roles.View";

        public const string RolesCreate =
            "Roles.Create";

        public const string RolesManagePermissions =
            "Roles.ManagePermissions";

        public static readonly string[] All =
        {
            DashboardView,

            TicketsViewOwn,
            TicketsViewAssigned,
            TicketsViewDepartment,
            TicketsViewAll,
            TicketsCreate,
            TicketsReply,
            TicketsAssign,
            TicketsChangeStatus,

            DepartmentsView,
            DepartmentsCreate,
            DepartmentsEdit,
            DepartmentsDelete,

            CategoriesView,
            CategoriesCreate,
            CategoriesEdit,
            CategoriesDelete,

            UsersView,
            UsersCreate,
            UsersEdit,
            UsersEditRoles,
            UsersChangeStatus,

            RolesView,
            RolesCreate,
            RolesManagePermissions
        };
    }
}