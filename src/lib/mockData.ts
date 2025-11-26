// src/lib/mockData.ts
import { Ticket, User, Attachment } from "@/types/ticket";

export const mockUser: User = {
  id: "1",
  name: "Dra. María González",
  email: "maria.gonzalez@hospital.com",
  role: "admin",
  department: "Cardiología",
  specialization: "Cardiólogo"
};

export const mockTechnician: User = {
  id: "2", 
  name: "Ing. Carlos Ruiz",
  email: "carlos.ruiz@hospital.com",
  role: "technician",
  department: "TI",
  specialization: "Soporte HIS"
};

export const mockAttachments: Attachment[] = [
  {
    id: "1",
    filename: "error-signos-vitales.png",
    url: "/attachments/error-signos-vitales.png",
    type: "image",
    uploaded_at: "2024-01-15T10:30:00Z",
    uploaded_by: mockUser
  },
  {
    id: "2",
    filename: "grabacion-error.mp4",
    url: "/attachments/grabacion-error.mp4", 
    type: "video",
    uploaded_at: "2024-01-15T10:35:00Z",
    uploaded_by: mockUser
  }
];

export const mockTickets: Ticket[] = [
  {
    id: "1",
    title: "Error en registro de signos vitales - Módulo HIS",
    description: "Al intentar registrar los signos vitales de pacientes en urgencias, el sistema muestra error 'Conexión con dispositivo perdida'. Los valores de presión arterial y saturación no se guardan en la historia clínica.",
    status: "open",
    priority: "critical",
    module: "HIS",
    submodule: "Signos vitales",
    reported_by: mockUser,
    assigned_to: mockTechnician,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    resolved_at: undefined,
    messages: [
      {
        id: "1",
        sender: mockUser,
        content: "Urgente: Este error está afectando el monitoreo de pacientes críticos en urgencias. Necesitamos solución inmediata.",
        sent_at: "2024-01-15T10:30:00Z",
        attachments: [mockAttachments[0]]
      },
      {
        id: "2", 
        sender: mockTechnician,
        content: "Estoy revisando el problema. Parece ser un issue con el driver del dispositivo de monitoreo. Activando protocolo de emergencia.",
        sent_at: "2024-01-15T10:45:00Z",
        attachments: []
      }
    ],
    attachments: mockAttachments,
    clinical_impact: "Pacientes en urgencias no tienen registro continuo de signos vitales, riesgo de no detectar deterioro clínico.",
    urgency_level: "emergency",
    affected_systems: ["Pacientes en espera", "Tratamientos en curso", "Atención en urgencias"]
  },
  {
    id: "2",
    title: "Fallo en sistema de agendamiento de cirugías",
    description: "El módulo de programación quirúrgica no permite asignar recursos (quirófano, instrumental, personal) para cirugías programadas para la próxima semana.",
    status: "in_progress",
    priority: "high", 
    module: "Quirófano",
    submodule: "Programación quirúrgica",
    reported_by: mockUser,
    assigned_to: mockTechnician,
    created_at: "2024-01-14T09:15:00Z",
    updated_at: "2024-01-15T08:20:00Z",
    resolved_at: undefined,
    messages: [],
    attachments: [],
    clinical_impact: "Cirugías programadas podrían cancelarse por falta de asignación de recursos.",
    urgency_level: "urgent",
    affected_systems: ["Cirugías programadas", "Pacientes en espera"]
  },
  {
    id: "3",
    title: "Error en dispensación de medicamentos controlados",
    description: "Al intentar dispensar medicamentos controlados desde farmacia, el sistema no genera el registro obligatorio en el libro de control.",
    status: "escalated",
    priority: "high",
    module: "Farmacia", 
    submodule: "Medicamentos controlados",
    reported_by: mockUser,
    assigned_to: undefined,
    created_at: "2024-01-13T14:20:00Z",
    updated_at: "2024-01-15T09:10:00Z",
    resolved_at: undefined,
    messages: [],
    attachments: [],
    clinical_impact: "Incumplimiento de normativa de medicamentos controlados. Riesgo legal y de seguridad.",
    urgency_level: "urgent",
    affected_systems: ["Tratamientos en curso", "Medicación programada"]
  }
];

// Exportar como 'tickets' también para compatibilidad
export const tickets = mockTickets;