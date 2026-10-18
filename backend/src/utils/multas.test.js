import test from "node:test";
import assert from "node:assert/strict";
import { calcularMulta } from "./multas.js";

test("calcularMulta devuelve cero cuando se devuelve en la fecha límite", () => {
  assert.deepEqual(calcularMulta("2026-10-15", "2026-10-15", 5), {
    diasRetraso: 0,
    monto: 0,
  });
});

test("calcularMulta calcula los días y el monto de retraso", () => {
  assert.deepEqual(calcularMulta("2026-10-10", "2026-10-13", 5), {
    diasRetraso: 3,
    monto: 15,
  });
});

test("calcularMulta devuelve cero si la devolución es antes de la fecha límite", () => {
  assert.deepEqual(calcularMulta("2026-10-15", "2026-10-12", 5), {
    diasRetraso: 0,
    monto: 0,
  });
});