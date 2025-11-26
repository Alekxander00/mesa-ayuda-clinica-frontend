// src/lib/ticket-utils.ts
import { TicketStatus, TicketPriority } from "@/types/ticket";

export function getStatusInfo(status: TicketStatus) {
  const statusMap = {
    open: { label: "Abierto", color: "var(--info-500)" },
    in_progress: { label: "En Progreso", color: "var(--warning-500)" },
    resolved: { label: "Resuelto", color: "var(--success-500)" },
    closed: { label: "Cerrado", color: "var(--gray-500)" },
    escalated: { label: "Escalado", color: "var(--error-500)" },
  };
  return statusMap[status] || statusMap.open;
}

export function getPriorityInfo(priority: TicketPriority) {
  const priorityMap = {
    low: { label: "Baja", color: "var(--success-500)" },
    medium: { label: "Media", color: "var(--warning-500)" },
    high: { label: "Alta", color: "var(--error-500)" },
    critical: { label: "Crítica", color: "var(--error-700)" },
  };
  return priorityMap[priority] || priorityMap.medium;
}

export const statusOptions = [
  { value: "open", label: "Abierto" },
  { value: "in_progress", label: "En Progreso" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
  { value: "escalated", label: "Escalado" },
];

export const priorityOptions = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

export const moduleOptions = [
  "Citas",
  "Historias Clínicas", 
  "Farmacia",
  "Laboratorio",
  "Radiología",
  "Facturación",
  "Recursos Humanos",
  "Otro"
];