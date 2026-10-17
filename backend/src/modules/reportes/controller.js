import PDFDocument from "pdfkit";
import { obtenerPrestamosActivosParaReporte } from "./service.js";

const columnas = [
  { label: "Socio", key: "socio", width: 130 },
  { label: "Carnet", key: "carnet", width: 56 },
  { label: "Libro", key: "libro", width: 190 },
  { label: "Salida", key: "fecha_salida", width: 70 },
  { label: "Límite", key: "fecha_limite", width: 70 },
  { label: "Estado", key: "estadoReporte", width: 65 },
  { label: "Multa (Q)", key: "multa", width: 67 },
];

function formatoQuetzales(monto) {
  return `Q ${Number(monto).toFixed(2)}`;
}

function textoCelda(row, key) {
  return key === "multa" ? formatoQuetzales(row[key]) : String(row[key] ?? "—");
}

export async function descargarPrestamosActivos(request, response, next) {
  try {
    const prestamos = await obtenerPrestamosActivosParaReporte();
    const document = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      info: {
        Title: "Reporte de préstamos activos",
        Author: "Biblioteca UMG",
      },
    });
    const generado = new Intl.DateTimeFormat("es-GT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const anchoTabla = columnas.reduce((total, columna) => total + columna.width, 0);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte-prestamos-activos.pdf"',
    );
    document.on("error", (error) => {
      if (response.headersSent) {
        response.destroy(error);
      } else {
        next(error);
      }
    });
    document.pipe(response);

    function encabezadoPagina(repetirTabla) {
      document
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor("#073568")
        .text("Universidad Mariano Gálvez de Escuintla", 36, 34, {
          width: anchoTabla,
        });
      document
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#17314e")
        .text(`Reporte de préstamos activos · Generado: ${generado}`, 36, 57, {
          width: anchoTabla,
        });
      document.y = 82;
      if (repetirTabla) dibujarEncabezadoTabla();
    }

    function dibujarEncabezadoTabla() {
      const y = document.y;
      let x = 36;
      document.font("Helvetica-Bold").fontSize(8).fillColor("#073568");
      for (const columna of columnas) {
        document.text(columna.label, x + 3, y + 5, {
          width: columna.width - 6,
          height: 16,
        });
        x += columna.width;
      }
      document
        .moveTo(36, y + 23)
        .lineTo(36 + anchoTabla, y + 23)
        .strokeColor("#0879bd")
        .stroke();
      document.y = y + 26;
    }

    encabezadoPagina(true);
    let totalMultas = 0;

    for (const prestamo of prestamos) {
      const celdas = columnas.map((columna) => ({
        ...columna,
        text: textoCelda(prestamo, columna.key),
      }));
      document.font("Helvetica").fontSize(8);
      const altoFila = Math.max(
        22,
        ...celdas.map((celda) =>
          document.heightOfString(celda.text, {
            width: celda.width - 8,
            font: "Helvetica",
            fontSize: 8,
          }) + 8,
        ),
      );
      const limiteFila = document.page.height - document.page.margins.bottom - 40;
      if (document.y + altoFila > limiteFila) {
        document.addPage();
        encabezadoPagina(true);
      }

      const inicioFila = document.y;
      let x = 36;
      document.font("Helvetica").fontSize(8).fillColor("#17314e");
      for (const celda of celdas) {
        document.text(celda.text, x + 3, inicioFila + 4, {
          width: celda.width - 8,
          height: altoFila - 6,
        });
        x += celda.width;
      }
      document
        .moveTo(36, inicioFila + altoFila)
        .lineTo(36 + anchoTabla, inicioFila + altoFila)
        .strokeColor("#d4e1eb")
        .stroke();
      document.y = inicioFila + altoFila;
      totalMultas += prestamo.multa;
    }

    const altoTotales = 38;
    if (document.y + altoTotales > document.page.height - document.page.margins.bottom) {
      document.addPage();
      encabezadoPagina(true);
    }
    const inicioTotales = document.y;
    document
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#073568")
      .text(`Total de préstamos: ${prestamos.length}`, 36, inicioTotales + 12);
    document.text(
      `Total de multas: ${formatoQuetzales(totalMultas)}`,
      260,
      inicioTotales + 12,
    );
    document.end();
  } catch (error) {
    next(error);
  }
}
