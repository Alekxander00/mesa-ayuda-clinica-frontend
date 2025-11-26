// frontend/src/services/ticketService.ts - SOLO INTERFACES
export interface TicketUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface TicketModule {
  id: number;
  label: string;
}

export interface TicketType {
  id: number;
  label: string;
}

export interface TicketMessage {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  sender: TicketUser;
}

export interface Ticket {
  id: string;
  code: string;
  subject: string;
  description: string;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  module_id: number;
  ticket_type_id: number;
  user: TicketUser;
  module: TicketModule;
  ticket_type: TicketType;
  assigned_to_user?: TicketUser;
  messages: TicketMessage[];
}

export interface CreateTicketData {
  module_id: number;
  ticket_type_id: number;
  subject: string;
  description: string;
  priority?: number;
}