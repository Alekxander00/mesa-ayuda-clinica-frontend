// src/types/ticket.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user' | 'auditor';
  department?: string;
  specialization?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  uploaded_at: string;
  uploaded_by: User;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  sent_at: string;
  attachments?: Attachment[];
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  module: string;
  submodule?: string;
  reported_by: User;
  assigned_to?: User;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages: Message[];
  attachments: Attachment[];
  clinical_impact?: string;
  urgency_level: 'routine' | 'urgent' | 'emergency';
  affected_systems: string[];
}