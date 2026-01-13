/**
 * Cloud Functions para envío automático de correos con PDF de acreditación
 */

import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import axios from "axios";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar opciones globales
setGlobalOptions({
  maxInstances: 50,
  timeoutSeconds: 540,
  memory: "512MiB",
});

// Mapa de equipos a escudos
const escudosMap: Record<string, string> = {
  america: "america.png",
  atlas: "atlas.png",
  chivas: "chivas.png",
  cruzazul: "cruzazul.png",
  juarez: "juarez.png",
  leon: "leon.png",
  mazatlan: "mazatlan.png",
  monterrey: "monterrey.png",
  necaxa: "necaxa.png",
  pachuca: "pachuca.png",
  puebla: "puebla.png",
  pumas: "pumas.png",
  queretaro: "queretaro.png",
  santos: "santos.png",
  tigres: "tigres.png",
  toluca: "toluca.png",
  tijuana: "tijuana.png",
};

/**
 * Normaliza el nombre del equipo
 */
function normalizarEquipo(equipo: string): string {
  return equipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-z]/g, "")
    .trim();
}

/**
 * Encuentra el archivo de escudo para un equipo
 */
function archivoEscudo(equipo: string): string | null {
  const key = normalizarEquipo(equipo);

  // Match exacto
  if (escudosMap[key]) {
    return escudosMap[key];
  }

  // Match por palabras
  const palabras = key.split(" ");
  for (const palabra of palabras) {
    if (escudosMap[palabra]) {
      return escudosMap[palabra];
    }
  }

  return null;
}

/**
 * Obtiene la URL del escudo desde Firebase Storage
 */
async function getEscudoUrl(equipo: string): Promise<string | null> {
  const archivo = archivoEscudo(equipo);

  if (!archivo) {
    console.log(`No se encontró archivo para el equipo: ${equipo}`);
    return null;
  }

  try {
    const bucket = admin.storage().bucket();
    // Los escudos están en la raíz del bucket
    const file = bucket.file(archivo);

    // Hacer el archivo público y obtener la URL pública
    await file.makePublic();

    // Obtener la URL pública directa
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${archivo}`;

    console.log(`Escudo encontrado para ${equipo}: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error obteniendo escudo para ${equipo}:`, error);
    return null;
  }
}

/**
 * Descarga el escudo desde Firebase Storage con reintentos
 */
async function getEscudoBuffer(equipo: string): Promise<Buffer | null> {
  const archivo = archivoEscudo(equipo);

  if (!archivo) {
    console.log(`No se encontro archivo para el equipo: ${equipo}`);
    return null;
  }

  const bucket = admin.storage().bucket();
  const file = bucket.file(archivo);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      const isLast = attempt === maxAttempts;
      console.error(
        `Error descargando escudo ${archivo}` +
          ` (intento ${attempt}/${maxAttempts}):`,
        error
      );
      if (isLast) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
    }
  }

  return null;
}

/**
 * Descarga una imagen y la convierte a Buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, {responseType: "arraybuffer"});
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error descargando imagen:", error);
    return null;
  }
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  shouldRetry?: (error: any) => boolean;
};

async function withRetry<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (attempt > 1) {
        console.log(`[RETRY] ${operationName} intento ${attempt}`);
      }
      return await operation();
    } catch (error) {
      const shouldRetry =
        attempt < options.maxAttempts &&
        (options.shouldRetry ? options.shouldRetry(error) : true);

      console.error(`[RETRY] ${operationName} fallo`, {
        intento: attempt,
        maxIntentos: options.maxAttempts,
        error: (error as Error).message,
      });

      if (!shouldRetry) {
        throw error;
      }

      const delay = options.baseDelayMs * attempt;
      await sleep(delay);
      attempt += 1;
    }
  }
}

const isRetriableHttpError = (error: any) => {
  const status = error?.response?.status;
  const code = error?.code;
  if (status === 429) {
    return true;
  }
  if (status && status >= 500) {
    return true;
  }
  return ["ETIMEDOUT", "ECONNRESET", "ECONNABORTED"].includes(code);
};

interface BrevoPayload {
  sender: { email: string; name: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  attachment?: Array<{
    content: string;
    name: string;
  }>;
}

/**
 * Trigger cuando se actualiza documento en usersAccess
 */
export const sendEmailOnStatusChange = onDocumentUpdated(
  {
    document: "usersAccess/{userId}",
    secrets: ["BREVO_API_KEY"],
    maxInstances: 50,
    timeoutSeconds: 540,
    memory: "512MiB",
    retry: true,
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();
    const userId = event.params.userId;

    if (!newData || !previousData) {
      console.log("[UPDATE] Datos no disponibles - userId:", userId);
      return;
    }

    console.log("[UPDATE] Documento actualizado:", {
      userId: userId,
      previousStatus: previousData.estatus,
      newStatus: newData.estatus,
      email: newData.email,
    });

    if (newData.estatus === previousData.estatus) {
      console.log("[UPDATE] Estatus sin cambios - userId:", userId);
      return;
    }

    if (newData.estatus !== "aprobado" && newData.estatus !== "rechazado") {
      console.log(
        "[UPDATE] Estatus no es aprobado/rechazado - userId:",
        userId
      );
      return;
    }

    console.log("[UPDATE] Iniciando envío de correo - userId:", userId);
    await sendEmailNotification(newData, userId, event.data?.after.ref);
  }
);

/**
 * Trigger cuando se crea documento en usersAccess
 */
export const sendEmailOnCreate = onDocumentCreated(
  {
    document: "usersAccess/{userId}",
    secrets: ["BREVO_API_KEY"],
    maxInstances: 50,
    timeoutSeconds: 540,
    memory: "512MiB",
    retry: true,
  },
  async (event) => {
    const newData = event.data?.data();
    const userId = event.params.userId;

    if (!newData) {
      console.log(
        "[CREATE] Datos no disponibles en creación",
        "- userId:",
        userId
      );
      return;
    }

    console.log("[CREATE] Documento creado:", {
      userId: userId,
      estatus: newData.estatus,
      email: newData.email,
      nombre: newData.nombre,
    });

    if (newData.estatus !== "aprobado") {
      console.log(
        "[CREATE] Documento no creado con estatus aprobado",
        "userId:",
        userId,
        "estatus:",
        newData.estatus
      );
      return;
    }

    console.log(
      "[CREATE] ✅ Iniciando envío de correo",
      "- userId:",
      userId,
      "email:",
      newData.email
    );
    await sendEmailNotification(newData, userId, event.data?.ref);
  }
);

/**
 * Función callable para reenviar el correo con PDF/QR
 * Si existe PDF, lo envía. Si no, lo genera primero.
 */
export const resendAccreditationEmail = onCall(
  {
    secrets: ["BREVO_API_KEY"],
    maxInstances: 20,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (request) => {
    // Validar autenticación
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const {userId} = request.data;

    if (!userId) {
      throw new HttpsError("invalid-argument", "userId es requerido");
    }

    console.log(
      "[RESEND] Iniciando reenvío de correo",
      "- userId:",
      userId,
      "- solicitadoPor:",
      request.auth.uid
    );

    try {
      const db = admin.firestore();
      const docRef = db.collection("usersAccess").doc(userId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new HttpsError("not-found", "Usuario no encontrado");
      }

      const userData = docSnap.data();

      if (!userData) {
        throw new HttpsError("internal", "Datos de usuario no disponibles");
      }

      // Solo permitir reenvío para usuarios aprobados
      if (userData.estatus !== "aprobado") {
        throw new HttpsError(
          "failed-precondition",
          "Solo se puede reenviar correo a usuarios aprobados"
        );
      }

      // Verificar si ya existe un PDF
      const existingPdfUrl = userData.pdfUrl || userData.pdfURL;

      if (existingPdfUrl) {
        console.log(
          "[RESEND] PDF existente encontrado",
          "- userId:",
          userId,
          "- pdfUrl:",
          existingPdfUrl
        );

        // Reenviar con PDF existente
        await resendWithExistingPDF(userData, userId, existingPdfUrl);
      } else {
        console.log(
          "[RESEND] PDF no existe, generando nuevo",
          "- userId:",
          userId
        );

        // Generar PDF y enviar
        await sendEmailNotification(userData, userId, docRef);
      }

      console.log(
        "[RESEND] ✅ Correo reenviado exitosamente",
        "- userId:",
        userId
      );

      return {
        success: true,
        message: "Correo enviado exitosamente",
        hasPdf: !!existingPdfUrl,
      };
    } catch (error) {
      const err = error as Error;
      console.error(
        "[RESEND] ❌ Error al reenviar correo:",
        "- userId:",
        userId,
        "- error:",
        err.message
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Error al reenviar correo: ${err.message}`
      );
    }
  }
);

/**
 * Función para obtener datos relacionados de Firestore
 */
async function getRelatedData(userData: any) {
  try {
    const db = admin.firestore();

    // Obtener área
    let areaNombre = "No especificada";
    if (userData.areaId) {
      try {
        const areaDoc = await db.collection("areas").doc(userData.areaId).get();
        if (areaDoc.exists) {
          areaNombre = areaDoc.data()?.nombre || "No especificada";
        }
      } catch (error) {
        console.log("Error obteniendo área:", error);
      }
    }

    // Obtener función
    let funcionNombre = "No especificada";
    if (userData.funcion) {
      try {
        const funcionDoc = await db
          .collection("funciones")
          .doc(userData.funcion)
          .get();
        if (funcionDoc.exists) {
          funcionNombre = funcionDoc.data()?.nombre || "No especificada";
        }
      } catch (error) {
        console.log("Error obteniendo función:", error);
      }
    }

    // Obtener empresa
    let empresaNombre = "No especificada";
    if (userData.empresaId) {
      try {
        const empresaDoc = await db
          .collection("empresas")
          .doc(userData.empresaId)
          .get();
        if (empresaDoc.exists) {
          empresaNombre = empresaDoc.data()?.nombre || "No especificada";
        }
      } catch (error) {
        console.log("Error obteniendo empresa:", error);
      }
    }

    // Obtener jornada activa desde Realtime Database
    let jornadaData = null;
    let escudoLocalUrl: string | null = null;
    let escudoVisitanteUrl: string | null = null;
    let escudoLocalBuffer: Buffer | null = null;
    let escudoVisitanteBuffer: Buffer | null = null;

    try {
      const rtdb = admin.database();
      const jornadaSnapshot = await rtdb
        .ref("jornada_activa")
        .orderByChild("activo")
        .equalTo(true)
        .once("value");

      const jornadas = jornadaSnapshot.val();
      if (jornadas) {
        const jornadaKey = Object.keys(jornadas)[0];
        jornadaData = jornadas[jornadaKey];

        // Obtener URLs de escudos si hay jornada activa
        if (
          jornadaData &&
          jornadaData.equipo_local &&
          jornadaData.equipo_visitante
        ) {
          console.log("Obteniendo URLs de escudos para:", {
            local: jornadaData.equipo_local,
            visitante: jornadaData.equipo_visitante,
          });

          [escudoLocalBuffer, escudoVisitanteBuffer] = await Promise.all([
            getEscudoBuffer(jornadaData.equipo_local),
            getEscudoBuffer(jornadaData.equipo_visitante),
          ]);

          // Obtener URLs solo si faltan buffers (fallback)
          if (!escudoLocalBuffer || !escudoVisitanteBuffer) {
            [escudoLocalUrl, escudoVisitanteUrl] = await Promise.all([
              !escudoLocalBuffer ?
                getEscudoUrl(jornadaData.equipo_local) :
                Promise.resolve(null),
              !escudoVisitanteBuffer ?
                getEscudoUrl(jornadaData.equipo_visitante) :
                Promise.resolve(null),
            ]);
          }

          console.log("URLs obtenidas:", {
            local: escudoLocalUrl,
            visitante: escudoVisitanteUrl,
          });
        }
      }
    } catch (error) {
      console.log("Error obteniendo jornada activa:", error);
    }

    return {
      areaNombre,
      funcionNombre,
      empresaNombre,
      jornadaData,
      escudoLocalUrl,
      escudoVisitanteUrl,
      escudoLocalBuffer,
      escudoVisitanteBuffer,
    };
  } catch (error) {
    console.error("Error obteniendo datos relacionados:", error);
    return {
      areaNombre: "No especificada",
      funcionNombre: "No especificada",
      empresaNombre: "No especificada",
      jornadaData: null,
      escudoLocalUrl: null,
      escudoVisitanteUrl: null,
      escudoLocalBuffer: null,
      escudoVisitanteBuffer: null,
    };
  }
}

/**
 * Generar QR code como base64
 */
async function generateQRCode(userId: string): Promise<string> {
  return await QRCode.toDataURL(userId, {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 200,
    margin: 1,
  });
}

/**
 * Generar PDF de constancia de acreditación
 */
async function generatePDF(
  userData: any,
  relatedData: any,
  userId: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: {top: 50, bottom: 50, left: 50, right: 50},
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const fullName = `${userData.nombre} ${userData.apellidoPaterno}`.trim();

      // Generar QR (debe ser async)
      generateQRCode(userId)
        .then(async (qrDataUrl) => {
          const qrBase64 = qrDataUrl.split(",")[1];
          const qrBuffer = Buffer.from(qrBase64, "base64");

          const pageWidth = doc.page.width;
          const margin = 50;
          const contentWidth = pageWidth - margin * 2;
          const colors = {
            primary: "#0B5E3B",
            text: "#111827",
            muted: "#6B7280",
            border: "#E5E7EB",
            surface: "#F9FAFB",
            alert: "#B91C1C",
            alertSurface: "#FEF2F2",
            alertBorder: "#FCA5A5",
          };

          const drawSection = (
            title: string,
            rows: Array<{ label: string; value: string }>,
            x: number,
            y: number,
            width: number
          ) => {
            const padding = 10;
            const startY = y;
            doc
              .fontSize(11)
              .font("Helvetica-Bold")
              .fillColor(colors.primary)
              .text(title, x + padding, y + padding, {
                width: width - padding * 2,
              });

            let currentY = doc.y + 6;
            doc
              .strokeColor(colors.border)
              .lineWidth(1)
              .moveTo(x + padding, currentY)
              .lineTo(x + width - padding, currentY)
              .stroke();

            currentY += 8;
            rows.forEach((row) => {
              doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .fillColor(colors.text)
                .text(`${row.label}: `, x + padding, currentY, {
                  continued: true,
                });
              doc.font("Helvetica").text(row.value, {
                width: width - padding * 2,
              });
              currentY = doc.y + 4;
            });

            const endY = currentY + padding;
            doc
              .roundedRect(x, startY, width, endY - startY, 6)
              .strokeColor(colors.border)
              .lineWidth(1)
              .stroke();

            return endY;
          };

          // Header
          doc
            .roundedRect(margin, margin - 10, contentWidth, 70, 8)
            .fill(colors.primary);
          doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .fillColor("white")
            .text("CONSTANCIA UNICA DE ACREDITACION", margin, margin + 8, {
              width: contentWidth,
              align: "center",
            });
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("white")
            .text("Sistema de Accesos - Club Leon", margin, margin + 38, {
              width: contentWidth,
              align: "center",
            });

          const contentTop = margin + 80;
          const columnGap = 14;
          const leftWidth = 320;
          const rightWidth = contentWidth - leftWidth - columnGap;
          const leftX = margin;
          const rightX = margin + leftWidth + columnGap;

          // Seccion izquierda: datos del acreditado
          let leftY = contentTop;
          leftY = drawSection(
            "DATOS DEL ACREDITADO",
            [
              {label: "Nombre", value: fullName},
              {label: "Pulsera", value: relatedData.areaNombre},
              {label: "Función", value: relatedData.funcionNombre},
              {label: "Empresa", value: relatedData.empresaNombre},
            ],
            leftX,
            leftY,
            leftWidth
          );

          leftY += 12;

          // Seccion izquierda: datos de la jornada
          if (relatedData.jornadaData) {
            const jornadaStartY = leftY;
            const padding = 10;

            // Título de la sección
            doc
              .fontSize(11)
              .font("Helvetica-Bold")
              .fillColor(colors.primary)
              .text("DATOS DE LA JORNADA", leftX + padding, leftY + padding, {
                width: leftWidth - padding * 2,
              });

            let currentY = doc.y + 6;
            doc
              .strokeColor(colors.border)
              .lineWidth(1)
              .moveTo(leftX + padding, currentY)
              .lineTo(leftX + leftWidth - padding, currentY)
              .stroke();

            currentY += 12;

            // Jornada
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(colors.text)
              .text("Jornada: ", leftX + padding, currentY, {
                continued: true,
              });
            doc.font("Helvetica").text(relatedData.jornadaData.jornada);
            currentY = doc.y + 6;

            // Partido con escudos
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(colors.text)
              .text("Partido:", leftX + padding, currentY);
            currentY = doc.y + 6;

            // Escudos y equipos en línea horizontal
            const escudoSize = 35;
            const escudosY = currentY;
            const centerX = leftX + leftWidth / 2;
            const vsWidth = 20;
            const spacing = 20; // Espaciado simétrico entre escudos y VS

            // Descargar escudos frescos para este PDF específico
            let escudoLocalBuffer: Buffer | null =
              relatedData.escudoLocalBuffer || null;
            let escudoVisitanteBuffer: Buffer | null =
              relatedData.escudoVisitanteBuffer || null;

            if (!escudoLocalBuffer && relatedData.escudoLocalUrl) {
              escudoLocalBuffer = await downloadImage(
                relatedData.escudoLocalUrl
              );
            }

            if (!escudoVisitanteBuffer && relatedData.escudoVisitanteUrl) {
              escudoVisitanteBuffer = await downloadImage(
                relatedData.escudoVisitanteUrl
              );
            }

            console.log("Escudos descargados para PDF:", {
              local: escudoLocalBuffer ?
                `${escudoLocalBuffer.length} bytes` :
                "null",
              visitante: escudoVisitanteBuffer ?
                `${escudoVisitanteBuffer.length} bytes` :
                "null",
            });

            console.log("Insertando escudos en PDF:", {
              tieneEscudoLocal: !!escudoLocalBuffer,
              tieneEscudoVisitante: !!escudoVisitanteBuffer,
            });

            // Escudo local - posicionado simétricamente a la izquierda del VS
            if (escudoLocalBuffer) {
              console.log("Insertando escudo local en PDF");
              const escudoLocalX = centerX - vsWidth / 2 - spacing - escudoSize;
              doc.image(escudoLocalBuffer, escudoLocalX, escudosY, {
                width: escudoSize,
                height: escudoSize,
                fit: [escudoSize, escudoSize],
              });
            } else {
              console.log("No hay buffer de escudo local");
            }

            // VS en el centro
            doc
              .fontSize(11)
              .font("Helvetica-Bold")
              .fillColor(colors.muted)
              .text("VS", centerX - vsWidth / 2, escudosY + 10, {
                width: vsWidth,
                align: "center",
              });

            // Escudo visitante - posicionado simétricamente a la derecha del VS
            if (escudoVisitanteBuffer) {
              console.log("Insertando escudo visitante en PDF");
              const escudoVisitanteX = centerX + vsWidth / 2 + spacing;
              doc.image(escudoVisitanteBuffer, escudoVisitanteX, escudosY, {
                width: escudoSize,
                height: escudoSize,
                fit: [escudoSize, escudoSize],
              });
            } else {
              console.log("No hay buffer de escudo visitante");
            }

            currentY = escudosY + escudoSize + 6;

            // Nombres de los equipos centrados
            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor(colors.text)
              .text(
                `${relatedData.jornadaData.equipo_local} vs ` +
                  `${relatedData.jornadaData.equipo_visitante}`,
                leftX + padding,
                currentY,
                {width: leftWidth - padding * 2, align: "center"}
              );
            currentY = doc.y + 6;

            // Fecha, Hora, Estadio
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(colors.text)
              .text("Fecha: ", leftX + padding, currentY, {continued: true});
            doc.font("Helvetica").text(relatedData.jornadaData.fecha);
            currentY = doc.y + 4;

            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(colors.text)
              .text("Hora: ", leftX + padding, currentY, {continued: true});
            doc.font("Helvetica").text(relatedData.jornadaData.hora);
            currentY = doc.y + 4;

            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(colors.text)
              .text("Estadio: ", leftX + padding, currentY, {
                continued: true,
              });
            doc.font("Helvetica").text(relatedData.jornadaData.estadio);
            currentY = doc.y + padding;

            // Dibujar el borde de la sección
            const jornadaEndY = currentY;
            doc
              .roundedRect(
                leftX,
                jornadaStartY,
                leftWidth,
                jornadaEndY - jornadaStartY,
                6
              )
              .strokeColor(colors.border)
              .lineWidth(1)
              .stroke();

            leftY = jornadaEndY;
          } else {
            // Si no hay jornada activa
            const jornadaRows = [
              {label: "Estado", value: "No hay jornada activa disponible"},
            ];
            leftY = drawSection(
              "DATOS DE LA JORNADA",
              jornadaRows,
              leftX,
              leftY,
              leftWidth
            );
          }

          // Seccion derecha: QR
          const qrBoxHeight = 260;
          doc
            .roundedRect(rightX, contentTop, rightWidth, qrBoxHeight, 6)
            .fillAndStroke(colors.surface, colors.border);
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor(colors.primary)
            .text("CODIGO QR DE ACCESO", rightX + 10, contentTop + 10, {
              width: rightWidth - 20,
              align: "center",
            });

          const qrSize = 170;
          const qrX = rightX + (rightWidth - qrSize) / 2;
          const qrY = contentTop + 40;
          doc.image(qrBuffer, qrX, qrY, {width: qrSize, height: qrSize});
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor(colors.muted)
            .text(
              "Presentar este codigo junto con identificacion oficial.",
              rightX + 10,
              qrY + qrSize + 8,
              {
                width: rightWidth - 20,
                align: "center",
              }
            );

          // Aviso importante
          const afterColumnsY = Math.max(leftY, contentTop + qrBoxHeight) + 18;
          doc
            .roundedRect(margin, afterColumnsY, contentWidth, 150, 8)
            .fillAndStroke(colors.alertSurface, colors.alertBorder);
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(colors.alert)
            .text("AVISO IMPORTANTE", margin, afterColumnsY + 10, {
              width: contentWidth,
              align: "center",
            });

          const avisos = [
            "El presente QR no garantiza el acceso al estadio.",
            "Para ingresar es indispensable contar con pulsera y " +
              "realizar el proceso en el area de acreditacion.",
            "Este QR:",
            "No es un boleto.",
            "No asegura lugar en tribuna.",
            "Requiere la presentacion de identificacion oficial vigente.",
            "Es valido unicamente para el partido del dia.",
            "Es intransferible.",
            "No valido para menores de edad.",
          ];

          let avisoY = afterColumnsY + 38;
          doc.fontSize(9).font("Helvetica").fillColor(colors.text);
          avisos.forEach((aviso) => {
            const prefix = aviso === "Este QR:" ? "" : "- ";
            doc.text(`${prefix}${aviso}`, margin + 16, avisoY, {
              width: contentWidth - 32,
            });
            avisoY = doc.y + 2;
          });

          // Footer
          doc
            .fontSize(8)
            .fillColor(colors.muted)
            .text("Sistema de Accesos - Club Leon", margin, avisoY + 14, {
              width: contentWidth,
              align: "center",
            });
          doc.text(
            `Generado: ${new Date().toLocaleString("es-MX")}`,
            margin,
            doc.y,
            {
              width: contentWidth,
              align: "center",
            }
          );

          doc.end();
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Subir PDF a Firebase Storage
 */
async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  userId: string,
  fileName: string
): Promise<string> {
  try {
    const bucket = admin.storage().bucket();
    const filePath = `acreditaciones/${userId}/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
      },
    });

    // Hacer el archivo público por 7 días
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    console.log("PDF subido a Storage:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error subiendo PDF a Storage:", error);
    throw error;
  }
}

/**
 * Enviar correo con PDF adjunto
 */
async function sendEmailNotification(
  userData: any,
  userId: string,
  docRef: any
) {
  const startTime = Date.now();
  console.log(`[EMAIL-START] userId: ${userId}, email: ${userData.email}`);
  let latestUserData = userData;

  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.error(
        "[EMAIL-ERROR] API Key de Brevo no configurada",
        `userId: ${userId}`
      );
      throw new Error("Brevo API Key no configurada");
    }

    if (docRef) {
      try {
        const latestSnap = await docRef.get();
        if (latestSnap.exists) {
          latestUserData = {
            ...latestUserData,
            ...latestSnap.data(),
          };
        }
      } catch (error) {
        console.log(
          "[EMAIL] No se pudo cargar el documento actualizado",
          error
        );
      }
    }

    const isApproved = latestUserData.estatus === "aprobado";
    const fullName =
      `${latestUserData.nombre} ${latestUserData.apellidoPaterno}`.trim();

    console.log(
      `[EMAIL-PROCESS] userId: ${userId}`,
      `estatus: ${latestUserData.estatus}, nombre: ${fullName}`
    );

    if (docRef && latestUserData.emailSent) {
      console.log(
        "[EMAIL-SKIP] Correo ya enviado anteriormente",
        "- userId:",
        userId
      );
      return;
    }

    if (!isApproved) {
      // Para rechazados, solo enviar correo simple sin PDF
      console.log(
        "[EMAIL-REJECT] Enviando correo de rechazo",
        "- userId:",
        userId
      );
      await withRetry(
        "rejection-email",
        () => sendRejectionEmail(latestUserData, fullName, BREVO_API_KEY),
        {maxAttempts: 3, baseDelayMs: 800, shouldRetry: isRetriableHttpError}
      );
      console.log(
        "[EMAIL-SUCCESS] Correo de rechazo enviado",
        "- userId:",
        userId,
        "tiempo:",
        `${Date.now() - startTime}ms`
      );
      return;
    }

    const existingPdfUrl = latestUserData.pdfUrl || latestUserData.pdfURL;
    let pdfUrl = existingPdfUrl;
    let pdfBuffer: Buffer | null = null;
    const fileName = `acreditacion_${userId}.pdf`;

    if (!pdfUrl) {
      // Obtener datos relacionados
      console.log("Obteniendo datos relacionados...");
      const relatedData = await getRelatedData(latestUserData);

      // Generar PDF
      console.log("Generando PDF...");
      pdfBuffer = await withRetry(
        "pdf-generation",
        () => generatePDF(latestUserData, relatedData, userId),
        {maxAttempts: 2, baseDelayMs: 600}
      );

      // Subir PDF a Storage
      console.log("Subiendo PDF a Storage...");
      if (!pdfBuffer) {
        throw new Error("Error: PDF buffer no generado");
      }
      const generatedPdfBuffer = pdfBuffer; // Type assertion helper
      pdfUrl = await withRetry(
        "pdf-upload",
        () => uploadPDFToStorage(generatedPdfBuffer, userId, fileName),
        {maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetriableHttpError}
      );

      // Guardar URL en Firestore
      if (docRef) {
        await withRetry(
          "firestore-update-pdf",
          () =>
            docRef.update({
              pdfUrl: pdfUrl,
              pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
          {maxAttempts: 3, baseDelayMs: 800}
        );
      }
    } else {
      console.log("[EMAIL] PDF existente detectado, reutilizando:", pdfUrl);
    }

    if (!pdfBuffer) {
      const bucket = admin.storage().bucket();
      const pdfPath = pdfUrl?.split(`${bucket.name}/`)[1];

      if (!pdfPath) {
        throw new Error("No se pudo extraer la ruta del PDF");
      }

      const file = bucket.file(pdfPath);
      pdfBuffer = await withRetry(
        "pdf-download",
        async () => {
          const [buffer] = await file.download();
          return buffer;
        },
        {maxAttempts: 3, baseDelayMs: 800, shouldRetry: isRetriableHttpError}
      );
    }

    // Preparar correo con PDF adjunto
    const pdfBase64 = pdfBuffer.toString("base64");

    const payload: BrevoPayload = {
      sender: {
        email: "sistemasleonfc@gmail.com",
        name: "FUERZA DEPORTIVA DEL LEON",
      },
      to: [{email: latestUserData.email, name: fullName}],
      subject: "✅ Constancia de Acreditación - Club León",
      htmlContent: getApprovalEmailTemplate(fullName, pdfUrl),
      attachment: [
        {
          content: pdfBase64,
          name: fileName,
        },
      ],
    };

    console.log(
      "[EMAIL-SENDING] Enviando correo con PDF adjunto",
      "- userId:",
      userId
    );
    const response = await withRetry(
      "brevo-send",
      () =>
        axios.post("https://api.brevo.com/v3/smtp/email", payload, {
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }),
      {maxAttempts: 4, baseDelayMs: 1200, shouldRetry: isRetriableHttpError}
    );

    const elapsed = Date.now() - startTime;
    console.log("[EMAIL-SUCCESS] ✅ Correo enviado exitosamente:", {
      userId: userId,
      to: latestUserData.email,
      status: response.status,
      messageId: response.data?.messageId,
      pdfUrl: pdfUrl,
      tiempoTotal: `${elapsed}ms`,
    });

    if (docRef) {
      try {
        await withRetry(
          "firestore-update-email",
          () =>
            docRef.update({
              emailSent: true,
              emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
              emailMessageId: response.data?.messageId || null,
            }),
          {maxAttempts: 3, baseDelayMs: 800}
        );
        console.log(
          "[EMAIL-FIRESTORE] Documento actualizado",
          "- userId:",
          userId
        );
      } catch (error) {
        console.error(
          "[EMAIL-FIRESTORE] Error actualizando estatus de envio",
          error
        );
      }
    }
  } catch (error) {
    const err = error as { message: string; response?: any };
    const elapsed = Date.now() - startTime;
    console.error("[EMAIL-ERROR] ❌ Error en proceso de envío:", {
      userId: userId,
      email: latestUserData.email,
      error: err.message,
      response: err.response?.data || null,
      tiempoTranscurrido: `${elapsed}ms`,
    });

    if (docRef) {
      await docRef.update({
        emailSent: false,
        emailError: err.message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(
        "[EMAIL-FIRESTORE] Error registrado en documento",
        "- userId:",
        userId
      );
    }

    // Re-throw para activar el retry automático
    throw error;
  }
}

/**
 * Reenviar correo con PDF existente
 */
async function resendWithExistingPDF(
  userData: any,
  userId: string,
  pdfUrl: string
): Promise<void> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    throw new Error("Brevo API Key no configurada");
  }

  const fullName = `${userData.nombre} ${userData.apellidoPaterno}`.trim();

  console.log(
    "[RESEND-EXISTING] Preparando reenvío con PDF existente",
    "- userId:",
    userId,
    "- email:",
    userData.email
  );

  // Descargar PDF existente de Storage
  const bucket = admin.storage().bucket();
  const pdfPath = pdfUrl.split(`${bucket.name}/`)[1];

  if (!pdfPath) {
    throw new Error("No se pudo extraer la ruta del PDF");
  }

  const file = bucket.file(pdfPath);
  const [pdfBuffer] = await file.download();
  const pdfBase64 = pdfBuffer.toString("base64");

  const payload: BrevoPayload = {
    sender: {
      email: "sistemasleonfc@gmail.com",
      name: "FUERZA DEPORTIVA DEL LEON",
    },
    to: [{email: userData.email, name: fullName}],
    subject: "✅ Constancia de Acreditación - Club León",
    htmlContent: getApprovalEmailTemplate(fullName, pdfUrl),
    attachment: [
      {
        content: pdfBase64,
        name: `acreditacion_${userData.nombre}.pdf`,
      },
    ],
  };

  console.log(
    "[RESEND-EXISTING] Enviando correo...",
    "- email:",
    userData.email
  );

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    payload,
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    "[RESEND-EXISTING] ✅ Correo reenviado",
    "- messageId:",
    response.data?.messageId
  );
}

/**
 * Enviar correo de rechazo simple
 */
async function sendRejectionEmail(
  userData: any,
  fullName: string,
  apiKey: string
) {
  console.log(
    "[REJECT-EMAIL] Preparando correo de rechazo",
    "para:",
    userData.email
  );

  const payload: BrevoPayload = {
    sender: {
      email: "sistemasleonfc@gmail.com",
      name: "FUERZA DEPORTIVA DEL LEON",
    },
    to: [{email: userData.email, name: fullName}],
    subject: "❌ Solicitud de Acceso Rechazada",
    htmlContent: getRejectionEmailTemplate(fullName),
  };

  console.log("[REJECT-EMAIL] Enviando a Brevo API...");
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    payload,
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    "[REJECT-EMAIL] ✅ Correo de rechazo enviado",
    "messageId:",
    response.data?.messageId
  );
  return response;
}

/**
 * Template HTML para correo de aprobación
 */
function getApprovalEmailTemplate(name: string, pdfUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  background-color: #007A53;
  color: white;
  padding: 30px 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
}
.content {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 0 0 8px 8px;
}
.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007A53;
  color: white !important;
  text-decoration: none;
  border-radius: 5px;
  margin: 20px 0;
}
.footer {
  text-align: center;
  margin-top: 30px;
  font-size: 12px;
  color: #666;
}
.warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px;
  margin: 20px 0;
}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>✅ Solicitud Aprobada</h1>
</div>
<div class="content">
<p>Estimado(a) <strong>${name}</strong>,</p>
<p>Nos complace informarle que su solicitud de acreditación 
ha sido <strong>aprobada exitosamente</strong>.</p>
<p>Adjunto a este correo encontrará su constancia de acreditación 
en formato PDF con código QR.</p>
<p style="text-align: center;">
<a href="${pdfUrl}" class="button">Descargar Constancia PDF</a>
</p>
<div class="warning">
<strong>⚠️ IMPORTANTE:</strong>
<ul style="margin: 10px 0; padding-left: 20px;">
<li>El QR no garantiza acceso al estadio</li>
<li>Debe presentar identificación oficial vigente</li>
<li>Requiere pulsera de acreditación</li>
<li>Válido solo para el partido indicado</li>
<li>Es intransferible</li>
</ul>
</div>
<p>Para cualquier duda o aclaración, por favor contacte al 
área de acreditaciones.</p>
<p>¡Nos vemos en el estadio!</p>
</div>
<div class="footer">
<p><strong>Sistema de Accesos - Club León</strong></p>
<p>Este es un correo automático, por favor no responder.</p>
</div>
</div>
</body>
</html>`;
}

/**
 * Template HTML para correo de rechazo
 */
function getRejectionEmailTemplate(name: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  background-color: #dc2626;
  color: white;
  padding: 30px 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
}
.content {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 0 0 8px 8px;
}
.footer {
  text-align: center;
  margin-top: 30px;
  font-size: 12px;
  color: #666;
}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>❌ Solicitud Rechazada</h1>
</div>
<div class="content">
<p>Estimado(a) <strong>${name}</strong>,</p>
<p>Lamentamos informarle que su solicitud de acreditación 
ha sido <strong>rechazada</strong>.</p>
<p>Para más información sobre los motivos del rechazo, 
por favor contacte al administrador del sistema de acreditaciones.</p>
<p>Gracias por su comprensión.</p>
</div>
<div class="footer">
<p><strong>Sistema de Accesos - Club León</strong></p>
<p>Este es un correo automático, por favor no responder.</p>
</div>
</div>
</body>
</html>`;
}

/**
 * =============================================================================
 * FUNCIONES PARA VISITAS DE AUTOS
 * =============================================================================
 */

/**
 * Cloud Function para generar PDF de visita y enviar por correo
 */
export const generateVisitaPDF = onCall(
  {
    secrets: ["BREVO_API_KEY"],
    maxInstances: 20,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (request) => {
    console.log("[VISITA-PDF] Iniciando generación de PDF");

    try {
      const {visitaId, visitaData} = request.data;

      if (!visitaId || !visitaData) {
        throw new HttpsError("invalid-argument", "Datos incompletos");
      }

      console.log("[VISITA-PDF] Generando PDF para visitaId:", visitaId);

      // Generar QR code
      const qrCodeDataUrl = await QRCode.toDataURL(visitaId, {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 200,
        margin: 1,
      });

      // Generar PDF
      const pdfBuffer = await generateVisitaPDFBuffer(
        visitaData,
        visitaId,
        qrCodeDataUrl
      );

      // Subir PDF a Storage
      const bucket = admin.storage().bucket();
      const fileName = `visita_${visitaId}_${Date.now()}.pdf`;
      const filePath = `visitas/${visitaId}/${fileName}`;
      const file = bucket.file(filePath);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: "application/pdf",
        },
      });

      await file.makePublic();
      const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      console.log("[VISITA-PDF] PDF subido a:", pdfUrl);

      // Guardar URL en Realtime Database
      const db = admin.database();
      await db.ref(`visitas/${visitaId}`).update({pdfUrl});

      // Enviar correo
      await sendVisitaEmail(visitaData, pdfBuffer, fileName, pdfUrl);

      console.log("[VISITA-PDF] ✅ Proceso completado exitosamente");

      return {
        success: true,
        pdfUrl,
        message: "PDF generado y correo enviado exitosamente",
      };
    } catch (error) {
      const err = error as Error;
      console.error("[VISITA-PDF] ❌ Error:", err.message);
      throw new HttpsError("internal", `Error: ${err.message}`);
    }
  }
);

/**
 * Cloud Function para reenviar correo de visita
 */
export const resendVisitaEmail = onCall(
  {
    secrets: ["BREVO_API_KEY"],
    maxInstances: 20,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (request) => {
    console.log("[VISITA-RESEND] Iniciando reenvío");

    try {
      const {visitaId} = request.data;

      if (!visitaId) {
        throw new HttpsError("invalid-argument", "visitaId es requerido");
      }

      // Obtener datos de Realtime Database
      const db = admin.database();
      const snapshot = await db.ref(`visitas/${visitaId}`).get();

      if (!snapshot.exists()) {
        throw new HttpsError("not-found", "Visita no encontrada");
      }

      const visitaData = snapshot.val();

      if (!visitaData.pdfUrl) {
        throw new HttpsError("not-found", "PDF no disponible");
      }

      // Descargar PDF existente
      const bucket = admin.storage().bucket();
      const pdfPath = visitaData.pdfUrl.split(`${bucket.name}/`)[1];
      const file = bucket.file(pdfPath);
      const [pdfBuffer] = await file.download();

      const fileName = `visita_${visitaData.nombre}.pdf`;

      // Reenviar correo
      await sendVisitaEmail(visitaData, pdfBuffer, fileName, visitaData.pdfUrl);

      console.log("[VISITA-RESEND] ✅ Correo reenviado exitosamente");

      return {
        success: true,
        message: "Correo reenviado exitosamente",
      };
    } catch (error) {
      const err = error as Error;
      console.error("[VISITA-RESEND] ❌ Error:", err.message);
      throw new HttpsError("internal", `Error: ${err.message}`);
    }
  }
);

/**
 * Genera el PDF de visita
 */
function generateVisitaPDFBuffer(
  visitaData: any,
  visitaId: string,
  qrCodeDataUrl: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: {top: 50, bottom: 50, left: 50, right: 50},
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const colors = {
          primary: "#007A53",
          text: "#111111",
          muted: "#6B7280",
          border: "#E0E0E0",
        };
        const pageWidth = doc.page.width;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const safeText = (value: any) =>
          value === null || value === undefined || value === "" ?
            "-" :
            String(value);

        // Header
        const headerHeight = 70;
        const headerY = 20;
        doc
          .roundedRect(margin, headerY, contentWidth, headerHeight, 10)
          .fillColor(colors.primary)
          .fill();

        doc
          .fillColor("#FFFFFF")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("ACCESO ESTACIONAMIENTO", margin, headerY + 16, {
            align: "center",
            width: contentWidth,
          });

        doc
          .fontSize(11)
          .font("Helvetica")
          .text("Sistema de Accesos - Club Leon", margin, headerY + 42, {
            align: "center",
            width: contentWidth,
          });

        let yPosition = headerY + headerHeight + 24;

        // Extraer jornada (formato: "Jornada X: equipo1 vs equipo2...")
        let jornadaNumero = "";
        let equipoLocal = "";
        let equipoVisitante = "";

        if (visitaData.partido) {
          const matchJornada = visitaData.partido.match(
            /Jornada (\d+):\s*([^v]+)\s*vs\s*([^(]+)/
          );
          if (matchJornada) {
            jornadaNumero = matchJornada[1];
            equipoLocal = matchJornada[2].trim();
            equipoVisitante = matchJornada[3].trim();
          }
        }

        // Layout de dos columnas
        const columnGap = 16;
        const columnWidth = (contentWidth - columnGap) / 2;
        const leftColumnX = margin;
        const rightColumnX = margin + columnWidth + columnGap;
        const labelWidth = 70;

        const drawCard = (
          title: string,
          rows: Array<{ label: string; value: string }>,
          x: number,
          y: number,
          width: number
        ) => {
          const padding = 12;
          const rowGap = 6;
          const titleFontSize = 12;
          const bodyFontSize = 10;

          doc
            .fontSize(titleFontSize)
            .font("Helvetica-Bold")
            .fillColor(colors.primary)
            .text(title, x + padding, y + padding, {
              width: width - padding * 2,
            });

          let currentY = doc.y + 6;
          doc
            .strokeColor(colors.border)
            .lineWidth(1)
            .moveTo(x + padding, currentY)
            .lineTo(x + width - padding, currentY)
            .stroke();
          currentY += 8;

          rows.forEach((row) => {
            const valueText = safeText(row.value);
            doc
              .fontSize(bodyFontSize)
              .font("Helvetica-Bold")
              .fillColor(colors.text);
            const labelHeight = doc.heightOfString(`${row.label}:`, {
              width: labelWidth,
            });
            doc.text(`${row.label}:`, x + padding, currentY, {
              width: labelWidth,
            });

            doc.font("Helvetica").fontSize(bodyFontSize).fillColor(colors.text);
            const valueHeight = doc.heightOfString(valueText, {
              width: width - padding * 2 - labelWidth,
            });
            doc.text(valueText, x + padding + labelWidth, currentY, {
              width: width - padding * 2 - labelWidth,
            });

            currentY += Math.max(labelHeight, valueHeight) + rowGap;
          });

          if (rows.length === 0) {
            currentY += padding;
          } else {
            currentY += padding - rowGap;
          }

          const cardHeight = currentY - y;
          doc
            .roundedRect(x, y, width, cardHeight, 8)
            .strokeColor(colors.border)
            .lineWidth(1)
            .stroke();

          return y + cardHeight;
        };

        const drawQRCodeCard = (
          title: string,
          x: number,
          y: number,
          width: number
        ) => {
          const padding = 12;
          const titleFontSize = 12;
          const bodyFontSize = 9;
          const qrSize = Math.min(140, width - padding * 2);
          const qrImageData = qrCodeDataUrl.split(",")[1];
          const qrBuffer = Buffer.from(qrImageData, "base64");
          const caption =
            "Presentar este codigo junto con identificacion oficial.";

          doc
            .fontSize(titleFontSize)
            .font("Helvetica-Bold")
            .fillColor(colors.primary)
            .text(title, x + padding, y + padding, {
              width: width - padding * 2,
              align: "center",
            });

          let currentY = doc.y + 6;
          doc
            .strokeColor(colors.border)
            .lineWidth(1)
            .moveTo(x + padding, currentY)
            .lineTo(x + width - padding, currentY)
            .stroke();
          currentY += 8;

          const qrX = x + (width - qrSize) / 2;
          doc.image(qrBuffer, qrX, currentY, {width: qrSize, height: qrSize});
          currentY += qrSize + 8;

          doc
            .fontSize(bodyFontSize)
            .font("Helvetica")
            .fillColor(colors.muted)
            .text(caption, x + padding, currentY, {
              width: width - padding * 2,
              align: "center",
            });
          currentY += doc.heightOfString(caption, {
            width: width - padding * 2,
          });
          currentY += padding;

          const cardHeight = currentY - y;
          doc
            .roundedRect(x, y, width, cardHeight, 8)
            .strokeColor(colors.border)
            .lineWidth(1)
            .stroke();

          return y + cardHeight;
        };

        const leftEndY = drawCard(
          "DATOS DEL VISITANTE",
          [
            {label: "Nombre", value: safeText(visitaData.nombre)},
            {label: "Modelo", value: safeText(visitaData.carroModelo)},
            {label: "Color", value: safeText(visitaData.color)},
            {label: "Placas", value: safeText(visitaData.placas)},
          ],
          leftColumnX,
          yPosition,
          columnWidth
        );

        const rightEndY = drawQRCodeCard(
          "CODIGO QR DE ACCESO",
          rightColumnX,
          yPosition,
          columnWidth
        );

        yPosition = Math.max(leftEndY, rightEndY) + 16;

        // DATOS DE LA JORNADA
        const jornadaX = margin;
        const jornadaWidth = contentWidth;
        const jornadaPadding = 12;
        const jornadaTitleFont = 12;
        const bodyFontSize = 10;
        const rowGap = 6;

        const drawLabeledValue = (
          label: string,
          value: string,
          x: number,
          y: number,
          width: number
        ) => {
          doc
            .fontSize(bodyFontSize)
            .font("Helvetica-Bold")
            .fillColor(colors.text);
          const labelHeight = doc.heightOfString(`${label}:`, {
            width: labelWidth,
          });
          doc.text(`${label}:`, x, y, {width: labelWidth});

          doc.font("Helvetica").fontSize(bodyFontSize).fillColor(colors.text);
          const valueHeight = doc.heightOfString(safeText(value), {
            width: width - labelWidth,
          });
          doc.text(safeText(value), x + labelWidth, y, {
            width: width - labelWidth,
          });

          return Math.max(labelHeight, valueHeight);
        };

        doc
          .fontSize(jornadaTitleFont)
          .font("Helvetica-Bold")
          .fillColor(colors.primary)
          .text(
            "DATOS DE LA JORNADA",
            jornadaX + jornadaPadding,
            yPosition + 12,
            {
              width: jornadaWidth - jornadaPadding * 2,
            }
          );

        let jornadaY = doc.y + 6;
        doc
          .strokeColor(colors.border)
          .lineWidth(1)
          .moveTo(jornadaX + jornadaPadding, jornadaY)
          .lineTo(jornadaX + jornadaWidth - jornadaPadding, jornadaY)
          .stroke();
        jornadaY += 10;

        if (jornadaNumero) {
          jornadaY +=
            drawLabeledValue(
              "Jornada",
              jornadaNumero,
              jornadaX + jornadaPadding,
              jornadaY,
              jornadaWidth - jornadaPadding * 2
            ) + rowGap;
        }

        doc
          .fontSize(bodyFontSize)
          .font("Helvetica-Bold")
          .fillColor(colors.text)
          .text("Partido:", jornadaX + jornadaPadding, jornadaY, {
            width: labelWidth,
          });
        jornadaY += 18;

        // Intentar cargar y mostrar escudos
        let escudosLoaded = false;
        if (equipoLocal && equipoVisitante) {
          try {
            let escudoLocalBuffer = await getEscudoBuffer(equipoLocal);
            let escudoVisitanteBuffer = await getEscudoBuffer(equipoVisitante);

            if (!escudoLocalBuffer || !escudoVisitanteBuffer) {
              const [escudoLocalUrl, escudoVisitanteUrl] = await Promise.all([
                !escudoLocalBuffer ? getEscudoUrl(equipoLocal) : null,
                !escudoVisitanteBuffer ? getEscudoUrl(equipoVisitante) : null,
              ]);

              if (escudoLocalUrl && !escudoLocalBuffer) {
                escudoLocalBuffer = await downloadImage(escudoLocalUrl);
              }
              if (escudoVisitanteUrl && !escudoVisitanteBuffer) {
                escudoVisitanteBuffer = await downloadImage(escudoVisitanteUrl);
              }
            }

            if (escudoLocalBuffer && escudoVisitanteBuffer) {
              const escudoSize = 50;
              const centerX = jornadaX + jornadaWidth / 2;
              const vsWidth = 24;
              const spacing = 16;
              const escudoLocalX = centerX - vsWidth / 2 - spacing - escudoSize;
              const escudoVisitanteX = centerX + vsWidth / 2 + spacing;

              doc.image(escudoLocalBuffer, escudoLocalX, jornadaY, {
                width: escudoSize,
                height: escudoSize,
              });
              doc
                .fillColor(colors.muted)
                .fontSize(12)
                .font("Helvetica-Bold")
                .text("VS", centerX - vsWidth / 2, jornadaY + 16, {
                  width: vsWidth,
                  align: "center",
                });
              doc.image(escudoVisitanteBuffer, escudoVisitanteX, jornadaY, {
                width: escudoSize,
                height: escudoSize,
              });

              jornadaY += escudoSize + 8;
              doc
                .fillColor(colors.text)
                .fontSize(10)
                .font("Helvetica")
                .text(
                  `${equipoLocal} vs ${equipoVisitante}`,
                  jornadaX + jornadaPadding,
                  jornadaY,
                  {
                    align: "center",
                    width: jornadaWidth - jornadaPadding * 2,
                  }
                );
              jornadaY += 18;
              escudosLoaded = true;
            }
          } catch (error) {
            console.log("Error cargando escudos:", error);
          }
        }

        // Si no se pudieron cargar los escudos, mostrar texto del partido
        if (!escudosLoaded) {
          doc
            .fillColor(colors.text)
            .fontSize(bodyFontSize)
            .font("Helvetica")
            .text(
              safeText(visitaData.partido),
              jornadaX + jornadaPadding,
              jornadaY,
              {
                width: jornadaWidth - jornadaPadding * 2,
              }
            );
          jornadaY +=
            doc.heightOfString(safeText(visitaData.partido), {
              width: jornadaWidth - jornadaPadding * 2,
            }) + rowGap;
        }

        // Fecha y hora (extraer del campo partido si esta disponible)
        const matchFechaHora = visitaData.partido?.match(
          /\(([^)]+)\)\s*(\d{2}:\d{2})/
        );
        let fecha = visitaData.fechaPartido;
        let hora = "";

        if (matchFechaHora) {
          fecha = matchFechaHora[1];
          hora = matchFechaHora[2];
        }

        jornadaY +=
          drawLabeledValue(
            "Fecha",
            safeText(fecha),
            jornadaX + jornadaPadding,
            jornadaY,
            jornadaWidth - jornadaPadding * 2
          ) + rowGap;

        if (hora) {
          jornadaY +=
            drawLabeledValue(
              "Hora",
              hora,
              jornadaX + jornadaPadding,
              jornadaY,
              jornadaWidth - jornadaPadding * 2
            ) + rowGap;
        }

        jornadaY +=
          drawLabeledValue(
            "Estadio",
            "Leon",
            jornadaX + jornadaPadding,
            jornadaY,
            jornadaWidth - jornadaPadding * 2
          ) + rowGap;

        const jornadaHeight = jornadaY - yPosition + (jornadaPadding - rowGap);
        doc
          .roundedRect(jornadaX, yPosition, jornadaWidth, jornadaHeight, 8)
          .strokeColor(colors.border)
          .lineWidth(1)
          .stroke();

        // Footer
        const footerY = doc.page.height - 40;
        doc
          .fillColor(colors.muted)
          .fontSize(8)
          .font("Helvetica")
          .text(
            "Documento generado - Sistema de Accesos Club Leon",
            0,
            footerY,
            {
              align: "center",
              width: doc.page.width,
            }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/**
 * Envía el correo con el PDF de visita
 */
async function sendVisitaEmail(
  visitaData: any,
  pdfBuffer: Buffer,
  fileName: string,
  pdfUrl: string
): Promise<void> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY no configurada");
  }

  const pdfBase64 = pdfBuffer.toString("base64");

  const payload: BrevoPayload = {
    sender: {
      email: "sistemasleonfc@gmail.com",
      name: "FUERZA DEPORTIVA DEL LEON",
    },
    to: [{email: visitaData.correo, name: visitaData.nombre}],
    subject: "🚗 Pase de Visita - Club León",
    htmlContent: getVisitaEmailTemplate(visitaData.nombre, pdfUrl),
    attachment: [
      {
        content: pdfBase64,
        name: fileName,
      },
    ],
  };

  console.log("[VISITA-EMAIL] Enviando correo a:", visitaData.correo);

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    payload,
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    "[VISITA-EMAIL] ✅ Correo enviado. MessageId:",
    response.data?.messageId
  );
}

/**
 * Template HTML para correo de visita
 */
function getVisitaEmailTemplate(name: string, pdfUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  background-color: #007A53;
  color: white;
  padding: 30px 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
}
.content {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 0 0 8px 8px;
}
.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007A53;
  color: white !important;
  text-decoration: none;
  border-radius: 5px;
  margin: 20px 0;
}
.footer {
  text-align: center;
  margin-top: 30px;
  font-size: 12px;
  color: #666;
}
.warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px;
  margin: 20px 0;
}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🚗 Pase de Visita Aprobado</h1>
</div>
<div class="content">
<p>Estimado(a) <strong>${name}</strong>,</p>
<p>Su pase de visita ha sido <strong>generado exitosamente</strong>.</p>
<p>Adjunto a este correo encontrará su pase de visita en formato PDF 
con código QR para acceso.</p>
<p style="text-align: center;">
<a href="${pdfUrl}" class="button">Descargar Pase PDF</a>
</p>
<div class="warning">
<strong>⚠️ IMPORTANTE:</strong>
<ul style="margin: 10px 0; padding-left: 20px;">
<li>Este pase es personal e intransferible</li>
<li>Debe presentar identificación oficial vigente</li>
<li>Válido solo para la fecha indicada</li>
<li>Siga las indicaciones del personal de seguridad</li>
<li>El vehículo debe coincidir con los datos registrados</li>
</ul>
</div>
<p>Para cualquier duda o aclaración, por favor contacte al 
área de accesos.</p>
<p>¡Bienvenido al estadio!</p>
</div>
<div class="footer">
<p><strong>Sistema de Accesos - Club León</strong></p>
<p>Este es un correo automático, por favor no responder.</p>
</div>
</div>
</body>
</html>`;
}
