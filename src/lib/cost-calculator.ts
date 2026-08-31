/**
 * Utilidades compartidas para cálculo de costes laborales.
 * Centraliza la fórmula de coste empresa para evitar duplicaciones.
 */

export interface CostCalculationResult {
  salarioBase: number;      // Salario mensual base (ajustado por pagas)
  cuotaPatronal: number;    // Cuota patronal SS
  costeEmpresaMes: number;  // Coste empresa total mensual
}

/**
 * Calcula el coste empresa mensual de un trabajador.
 * @param salaryMonthly - Salario bruto mensual
 * @param pagas - Número de pagas anuales (12 o 14)
 * @param ssPct - Porcentaje de Seguridad Social patronal (ej. 31.4)
 */
export function calcularCosteEmpresa(
  salaryMonthly: number,
  pagas: number = 12,
  ssPct: number = 31.4
): CostCalculationResult {
  // Si tiene 14 pagas, el coste mensual real es (salario * 14) / 12
  const salarioBase = pagas === 14 ? (salaryMonthly * 14) / 12 : salaryMonthly;
  const cuotaPatronal = (salarioBase * ssPct) / 100;
  const costeEmpresaMes = salarioBase + cuotaPatronal;

  return {
    salarioBase: Number(salarioBase.toFixed(2)),
    cuotaPatronal: Number(cuotaPatronal.toFixed(2)),
    costeEmpresaMes: Number(costeEmpresaMes.toFixed(2)),
  };
}

/**
 * Calcula el importe mensual imputado a un proyecto.
 * @param costeEmpresaMes - Coste empresa mensual total
 * @param weeklyHours - Horas semanales imputadas al proyecto
 * @param maxWeeklyHours - Jornada máxima semanal del trabajador
 */
export function calcularImporteImputado(
  costeEmpresaMes: number,
  weeklyHours: number,
  maxWeeklyHours: number = 37.5
): number {
  if (maxWeeklyHours <= 0) return 0;
  const pct = weeklyHours / maxWeeklyHours;
  return Number((costeEmpresaMes * pct).toFixed(2));
}

/**
 * Calcula el porcentaje de jornada imputado.
 */
export function calcularPorcentajeJornada(
  weeklyHours: number,
  maxWeeklyHours: number = 37.5
): number {
  if (maxWeeklyHours <= 0) return 0;
  return Number(((weeklyHours / maxWeeklyHours) * 100).toFixed(2));
}
