export function calcularMulta(fechaLimite, fechaDevolucionOHoy, multaPorDia) {
  const dueDate = new Date(`${fechaLimite}T00:00:00Z`);
  const endDate = new Date(`${fechaDevolucionOHoy}T00:00:00Z`);
  if (Number.isNaN(dueDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new TypeError("Las fechas deben tener formato YYYY-MM-DD");
  }

  const diasRetraso = Math.max(0, Math.floor((endDate - dueDate) / 86_400_000));
  const monto = Number((diasRetraso * Number(multaPorDia)).toFixed(2));
  return { diasRetraso, monto };
}