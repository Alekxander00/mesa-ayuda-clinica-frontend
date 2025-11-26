// src/lib/clinic-modules.ts
export const clinicalModules = {
  HIS: {
    name: "Sistema de Historia Clínica",
    submodules: [
      "Registro de pacientes",
      "Historia clínica electrónica",
      "Epicrisis",
      "Signos vitales",
      "Evolución médica"
    ]
  },
  CITAS: {
    name: "Gestión de Citas",
    submodules: [
      "Agendamiento",
      "Confirmación",
      "Reagendamiento",
      "Recordatorios"
    ]
  },
  FARMACIA: {
    name: "Farmacia y Medicamentos",
    submodules: [
      "Dispensación",
      "Control de inventario",
      "Recetas médicas",
      "Medicamentos controlados"
    ]
  },
  LABORATORIO: {
    name: "Laboratorio Clínico",
    submodules: [
      "Toma de muestras",
      "Resultados",
      "Microbiología",
      "Hematología"
    ]
  },
  IMAGENES: {
    name: "Imágenes Diagnósticas",
    submodules: [
      "Radiología digital",
      "Tomografía",
      "Resonancia magnética",
      "Archivo PACS"
    ]
  },
  URGENCIAS: {
    name: "Servicio de Urgencias",
    submodules: [
      "Triaje",
      "Monitorización",
      "Emergencias críticas"
    ]
  },
  QUIRÓFANO: {
    name: "Quirófano y Cx",
    submodules: [
      "Programación quirúrgica",
      "Inventario instrumental",
      "Anestesia"
    ]
  }
};

export const urgencyLevels = [
  { value: 'routine', label: 'Rutina', color: 'var(--success-500)' },
  { value: 'urgent', label: 'Urgente', color: 'var(--warning-500)' },
  { value: 'emergency', label: 'Emergencia', color: 'var(--error-500)' }
];

export const affectedSystems = [
  "Pacientes en espera",
  "Procedimientos diagnósticos",
  "Tratamientos en curso",
  "Medicación programada",
  "Cirugías programadas",
  "Atención en urgencias"
];