using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Api.DTOs.Tickets;
using SupportFlow.Api.Helpers;
using SupportFlow.Api.Interfaces;


namespace SupportFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TicketsController : ControllerBase
    {
   
   
        private readonly ITicketService _ticketService;

        public TicketsController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }


        [HttpPost]
        [HasPermission(PermissionNames.TicketsCreate)]
        public async Task<IActionResult> Create(
            CreateTicketRequest request)
        {
            object result = await _ticketService.CreateAsync(
                request,
                User
            );

            return Created(string.Empty, result);
        }


        [HttpPost("{id:int}/messages")]
        [HasPermission(PermissionNames.TicketsReply)]
        public async Task<IActionResult> AddMessage(
     int id,
     CreateTicketMessageRequest request)
        {
            object? result = await _ticketService.AddMessageAsync(
                id,
                request,
                User
            );

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }





        [HttpPut("{id:int}/assign")]
        [HasPermission(PermissionNames.TicketsAssign)]
            public async Task<IActionResult> AssignTicket(
              int id,
              AssignTicketRequest request)
            {
            object? result = await _ticketService.AssignAsync(
                id,
                request);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }




        [HttpPut("{id:int}/status")]
        [HasPermission(PermissionNames.TicketsChangeStatus)]
        public async Task<IActionResult> ChangeStatus(
             int id,
             ChangeTicketStatusRequest request)
        {
            object? result = await _ticketService.ChangeStatusAsync(
                id,
                request);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }






        [HttpGet("{id:int}/messages")]
        public async Task<IActionResult> GetMessages(int id)
        {
            object? result = await _ticketService.GetMessagesAsync(
                id,
                User
            );

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }



        [HttpPost("{id:int}/attachments")]
        [HasPermission(PermissionNames.TicketsReply)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAttachment(
       int id,
       [FromForm] UploadTicketAttachmentRequest request)
        {
            object? result =
                await _ticketService.UploadAttachmentAsync(
                    id,
                    request,
                    User);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }




        [HttpGet("{id:int}/attachments")]
        public async Task<IActionResult> GetAttachments(int id)
        {
            object? result =
                await _ticketService.GetAttachmentsAsync(
                    id,
                    User);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }



        [HttpDelete("{ticketId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(
            int ticketId,
            int attachmentId)
        {
            object? result =
                await _ticketService.DeleteAttachmentAsync(
                    ticketId,
                    attachmentId,
                    User);

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }



        [HttpGet]
        public async Task<IActionResult> GetAll(
        [FromQuery] TicketQueryRequest request)
        {
            object result = await _ticketService.GetAllAsync(
                request,
                User);

            return Ok(result);
        }




        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            object? result = await _ticketService.GetByIdAsync(
                id,
                User
            );

            if (result is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            return Ok(result);
        }



        [HttpGet("categories")]
        [HasPermission(PermissionNames.TicketsCreate)]
        public async Task<IActionResult> GetCreateTicketCategories()
        {
            object result =
                await _ticketService.GetCreateTicketCategoriesAsync(
                    User
                );

            return Ok(result);
        }


    }
}