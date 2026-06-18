// Placeholder recruitment-process stages, in order. The real stage names will
// come later — these are safe stand-ins. The timeline and admin controls are
// driven entirely by this list, so updating it here updates the whole app.
export const PROCESS_STAGES = [
  {
    key: "solicitud_recibida",
    label: "Solicitud recibida",
    description: "Recibimos los requerimientos del cargo.",
  },
  {
    key: "busqueda",
    label: "Búsqueda de candidatos",
    description: "Buscamos y contactamos posibles candidatos.",
  },
  {
    key: "evaluacion",
    label: "Evaluación de candidatos",
    description: "Evaluamos competencias y personalidad de los candidatos.",
  },
  {
    key: "presentacion",
    label: "Presentación a la empresa",
    description: "Presentamos la terna de candidatos seleccionados.",
  },
  {
    key: "finalizado",
    label: "Proceso finalizado",
    description: "El proceso se ha cerrado.",
  },
] as const;

export type ProcessStageKey = (typeof PROCESS_STAGES)[number]["key"];

export const PROCESS_STAGE_KEYS = PROCESS_STAGES.map((s) => s.key);

export function stageIndex(key: string): number {
  const i = PROCESS_STAGES.findIndex((s) => s.key === key);
  return i === -1 ? 0 : i;
}

export function stageLabel(key: string): string {
  return PROCESS_STAGES[stageIndex(key)].label;
}
