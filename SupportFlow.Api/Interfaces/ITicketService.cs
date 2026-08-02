using SupportFlow.Api.DTOs.Tickets;
using System.Security.Claims;

namespace SupportFlow.Api.Interfaces
{
    public interface ITicketService
    {
        Task<object> CreateAsync(
            CreateTicketRequest request,
            ClaimsPrincipal user);

        Task<object> GetAllAsync(
             TicketQueryRequest request,
             ClaimsPrincipal user);

        Task<object?> GetByIdAsync(
            int id,
            ClaimsPrincipal user);

        Task<object?> AssignAsync(
            int ticketId,
            AssignTicketRequest request);

        Task<object?> ChangeStatusAsync(
            int ticketId,
            ChangeTicketStatusRequest request);

        Task<object?> AddMessageAsync(
            int ticketId,
            CreateTicketMessageRequest request,
            ClaimsPrincipal user);


        Task<object?> GetMessagesAsync(
            int ticketId,
            ClaimsPrincipal user);



        Task<object?> UploadAttachmentAsync(
            int ticketId,
            UploadTicketAttachmentRequest request,
            ClaimsPrincipal user);

        Task<object?> GetAttachmentsAsync(
            int ticketId,
            ClaimsPrincipal user);

        Task<object?> DeleteAttachmentAsync(
            int ticketId,
            int attachmentId,
            ClaimsPrincipal user);

        Task<object> GetCreateTicketCategoriesAsync(
            ClaimsPrincipal user);

    }
}