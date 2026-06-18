// Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006) — a 20-item public-domain
// (International Personality Item Pool) measure of the Big Five.
// 4 items per factor; reverse-keyed items are subtracted from 6 when scoring.

export type Factor =
  | "extraversion"
  | "agreeableness"
  | "conscientiousness"
  | "neuroticism"
  | "openness";

export interface MiniIpipItem {
  id: string; // q1..q20
  text: string; // Spanish, phrased as a self-description
  factor: Factor;
  reverse: boolean;
}

// 5-point agreement scale.
export const LIKERT_OPTIONS = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Totalmente de acuerdo" },
] as const;

export const MINI_IPIP_ITEMS: MiniIpipItem[] = [
  { id: "q1", text: "Soy el alma de la fiesta.", factor: "extraversion", reverse: false },
  { id: "q2", text: "Me identifico con los sentimientos de los demás.", factor: "agreeableness", reverse: false },
  { id: "q3", text: "Hago mis tareas de inmediato.", factor: "conscientiousness", reverse: false },
  { id: "q4", text: "Tengo cambios de humor frecuentes.", factor: "neuroticism", reverse: false },
  { id: "q5", text: "Tengo una imaginación vívida.", factor: "openness", reverse: false },
  { id: "q6", text: "No hablo mucho.", factor: "extraversion", reverse: true },
  { id: "q7", text: "No me interesan los problemas de otras personas.", factor: "agreeableness", reverse: true },
  { id: "q8", text: "A menudo olvido poner las cosas en su lugar.", factor: "conscientiousness", reverse: true },
  { id: "q9", text: "Estoy relajado(a) la mayor parte del tiempo.", factor: "neuroticism", reverse: true },
  { id: "q10", text: "No me interesan las ideas abstractas.", factor: "openness", reverse: true },
  { id: "q11", text: "Converso con muchas personas distintas en las reuniones.", factor: "extraversion", reverse: false },
  { id: "q12", text: "Percibo las emociones de los demás.", factor: "agreeableness", reverse: false },
  { id: "q13", text: "Me gusta el orden.", factor: "conscientiousness", reverse: false },
  { id: "q14", text: "Me altero con facilidad.", factor: "neuroticism", reverse: false },
  { id: "q15", text: "Tengo dificultad para comprender ideas abstractas.", factor: "openness", reverse: true },
  { id: "q16", text: "Tiendo a mantenerme en un segundo plano.", factor: "extraversion", reverse: true },
  { id: "q17", text: "Realmente no me intereso por los demás.", factor: "agreeableness", reverse: true },
  { id: "q18", text: "Desordeno las cosas.", factor: "conscientiousness", reverse: true },
  { id: "q19", text: "Rara vez me siento decaído(a).", factor: "neuroticism", reverse: true },
  { id: "q20", text: "No tengo una buena imaginación.", factor: "openness", reverse: true },
];

export interface FactorScores {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
}

// Returns the mean score (1.00–5.00) for each Big Five factor.
export function scoreMiniIpip(answers: Record<string, number>): FactorScores {
  const sums: Record<Factor, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    neuroticism: 0,
    openness: 0,
  };
  const counts: Record<Factor, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    neuroticism: 0,
    openness: 0,
  };

  for (const item of MINI_IPIP_ITEMS) {
    const raw = answers[item.id];
    const value = item.reverse ? 6 - raw : raw;
    sums[item.factor] += value;
    counts[item.factor] += 1;
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    extraversion: round(sums.extraversion / counts.extraversion),
    agreeableness: round(sums.agreeableness / counts.agreeableness),
    conscientiousness: round(sums.conscientiousness / counts.conscientiousness),
    neuroticism: round(sums.neuroticism / counts.neuroticism),
    openness: round(sums.openness / counts.openness),
  };
}

// For display we show "Estabilidad emocional" (the inverse of Neuroticism) so
// that, across all five bars, higher = generally more favorable in a work context.
export interface DisplayDimension {
  label: string;
  description: string;
  value: number; // 1–5
  percent: number; // 0–100
}

export function displayDimensions(scores: FactorScores): DisplayDimension[] {
  const dims: { label: string; description: string; value: number }[] = [
    {
      label: "Responsabilidad",
      description:
        "Organización, disciplina y orientación al logro. Es el rasgo más asociado al desempeño laboral.",
      value: scores.conscientiousness,
    },
    {
      label: "Estabilidad emocional",
      description: "Calma y manejo del estrés frente a la presión.",
      value: 6 - scores.neuroticism,
    },
    {
      label: "Extraversión",
      description: "Sociabilidad, energía e iniciativa en la interacción.",
      value: scores.extraversion,
    },
    {
      label: "Amabilidad",
      description: "Cooperación, empatía y trabajo en equipo.",
      value: scores.agreeableness,
    },
    {
      label: "Apertura a la experiencia",
      description: "Curiosidad, creatividad y apertura a nuevas ideas.",
      value: scores.openness,
    },
  ];

  return dims.map((d) => ({
    ...d,
    percent: Math.round(((d.value - 1) / 4) * 100),
  }));
}
