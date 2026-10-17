import PDFDocument from "pdfkit";
import { obtenerPrestamosActivosParaReporte } from "./service.js";

const columnas = [
  { label: "Socio", key: "socio", width: 122 },
  { label: "Carnet", key: "carnet", width: 67 },
  { label: "Libro", key: "titulo", width: 220 },
  { label: "Salida", key: "fechaSalida", width: 72 },
  { label: "Límite", key: "fechaLimite", width: 72 },
  { label: "Estado", key: "estadoReporte", width: 82 },
  { label: "Multa", key: "monto", width: 78 },
];

function fechaHoraGeneracion() {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Guatemala",
  }).format(new Date());
}

function formatoFecha(value) {
  return value ? String(value).slice(0, 10) : "—";
}

function valorCelda(prestamo, key) {
  if (key === "fechaSalida" || key === "fechaLimite") return formatoFecha(prestamo[key]);
  if (key === "monto") return `Q ${Number(prestamo.monto).toFixed(2)}`;
  return String(prestamo[key] ?? "—");
}

function dibujarEncabezado(doc, total, generado) {
  const left = doc.page.margins.left;
  const width = columnas.reduce((sum, columna) => sum + columna.width, 0);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#152b43")
    .text("Universidad Mariano Gálvez de Escuintla", left, 27, { width });
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#25384b")
    .text("Reporte de préstamos activos", left, 48, { width });
  doc.font("Helvetica").fontSize(8).fillColor("#586779")
    .text(`Generado: ${generado} · Total de préstamos: ${total}`, left, 66, { width });
  let x = left;
  const y = 88;
  doc.rect(left, y, width, 22).fill("#e9eff5");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#152b43");
  for (const columna of columnas) {
    doc.text(columna.label, x + 4, y + 7, { width: columna.width - 8, lineBreak: false });
    x += columna.width;
  }
  doc.y = y + 22;
  doc.x = left;
  return { left, width };
}

function dibujarFila(doc, prestamo, bounds, total, generado) {
  doc.font("Helvetica").fontSize(8);
  const values = columnas.map((columna) => valorCelda(prestamo, columna.key));
  const heights = values.map((value, index) => doc.heightOfString(value, {
    width: columnas[index].width - 8,
    lineGap: 1,
  }));
  const height = Math.max(23, ...heights.map((value) => value + 10));
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    dibujarEncabezado(doc, total, generado);
  }

  const y = doc.y;
  doc.save().strokeColor("#d8e0e8").lineWidth(0.5)
    .moveTo(bounds.left, y + height).lineTo(bounds.left + bounds.width, y + height).stroke().restore();
  let x = bounds.left;
  values.forEach((value, index) => {
    doc.fillColor("#25384b").text(value, x + 4, y + 5, {
      width: columnas[index].width - 8,
      height: height - 8,
      lineGap: 1,
    });
    x += columnas[index].width;
  });
  doc.y = y + height;
  doc.x = bounds.left;
}

function dibujarTotales(doc, prestamos, bounds, generado) {
  const totalMultas = prestamos.reduce((sum, prestamo) => sum + prestamo.monto, 0);
  if (doc.y + 34 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    dibujarEncabezado(doc, prestamos.length, generado);
  }
  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#152b43")
    .text(`Total de préstamos: ${prestamos.length}`, bounds.left, doc.y, { width: bounds.width });
  doc.text(`Total de multas acumuladas: Q ${totalMultas.toFixed(2)}`, {
    width: bounds.width,
  });
}

export async function prestamosActivosPdf(_request, response, next) {
  let prestamos;
  try {
    prestamos = await obtenerPrestamosActivosParaReporte();
  } catch (error) {
    next(error);
    return;
  }

  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", 'attachment; filename="prestamos-activos.pdf"');
  const doc = new PDFDocument({
    size: "LETTER",
    layout: "landscape",
    margins: { top: 32, right: 30, bottom: 35, left: 30 },
    bufferPages: false,
  });
  doc.on("error", (error) => response.destroy(error));
  doc.pipe(response);
  const generado = fechaHoraGeneracion();
  const bounds = dibujarEncabezado(doc, prestamos.length, generado);
  if (prestamos.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#586779")
      .text("No hay préstamos activos para incluir en este informe.", bounds.left, doc.y + 12, {
        width: bounds.width,
      });
  } else {
    for (const prestamo of prestamos) {
      dibujarFila(doc, prestamo, bounds, prestamos.length, generado);
    }
  }
  dibujarTotales(doc, prestamos, bounds, generado);
  doc.end();
}
