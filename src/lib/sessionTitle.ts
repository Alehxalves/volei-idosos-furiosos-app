const WEEKDAYS_PT = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];

export function weekdayPt(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAYS_PT[new Date(y, m - 1, d).getDay()];
}

export function defaultSessionTitle(date: string): string {
  return `Vôlei IDOSOS & FURIOSOS ${weekdayPt(date)}`;
}
