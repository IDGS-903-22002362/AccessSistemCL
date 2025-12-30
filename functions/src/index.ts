/**
 * Cloud Functions para envío automático de correos con PDF de acreditación
 */

import {
  onDocumentUpdated,
  onDocumentCreated,
} from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar opciones globales
setGlobalOptions({ maxInstances: 10 });

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
    document: 'usersAccess/{userId}',
    secrets: ['BREVO_API_KEY'],
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) {
      console.log('Datos no disponibles');
      return;
    }

    console.log('Documento actualizado:', {
      userId: event.params.userId,
      previousStatus: previousData.estatus,
      newStatus: newData.estatus,
    });

    if (newData.estatus === previousData.estatus) {
      console.log('Estatus sin cambios');
      return;
    }

    if (newData.estatus !== 'aprobado' && newData.estatus !== 'rechazado') {
      console.log('Estatus no es aprobado/rechazado');
      return;
    }

    await sendEmailNotification(
      newData,
      event.params.userId,
      event.data?.after.ref
    );
  }
);

/**
 * Trigger cuando se crea documento en usersAccess
 */
export const sendEmailOnCreate = onDocumentCreated(
  {
    document: 'usersAccess/{userId}',
    secrets: ['BREVO_API_KEY'],
  },
  async (event) => {
    const newData = event.data?.data();

    if (!newData) {
      console.log('Datos no disponibles en creacion');
      return;
    }

    console.log('Documento creado:', {
      userId: event.params.userId,
      estatus: newData.estatus,
      email: newData.email,
    });

    if (newData.estatus !== 'aprobado') {
      console.log('Documento no creado con estatus aprobado');
      return;
    }

    console.log('Enviando correo por creacion aprobada');
    await sendEmailNotification(newData, event.params.userId, event.data?.ref);
  }
);

/**
 * Función para obtener datos relacionados de Firestore
 */
async function getRelatedData(userData: any) {
  try {
    const db = admin.firestore();

    // Obtener área
    let areaNombre = 'No especificada';
    if (userData.areaId) {
      try {
        const areaDoc = await db.collection('areas').doc(userData.areaId).get();
        if (areaDoc.exists) {
          areaNombre = areaDoc.data()?.nombre || 'No especificada';
        }
      } catch (error) {
        console.log('Error obteniendo área:', error);
      }
    }

    // Obtener función
    let funcionNombre = 'No especificada';
    if (userData.funcion) {
      try {
        const funcionDoc = await db
          .collection('funciones')
          .doc(userData.funcion)
          .get();
        if (funcionDoc.exists) {
          funcionNombre = funcionDoc.data()?.nombre || 'No especificada';
        }
      } catch (error) {
        console.log('Error obteniendo función:', error);
      }
    }

    // Obtener empresa
    let empresaNombre = 'No especificada';
    if (userData.empresaId) {
      try {
        const empresaDoc = await db
          .collection('empresas')
          .doc(userData.empresaId)
          .get();
        if (empresaDoc.exists) {
          empresaNombre = empresaDoc.data()?.nombre || 'No especificada';
        }
      } catch (error) {
        console.log('Error obteniendo empresa:', error);
      }
    }

    // Obtener jornada activa desde Realtime Database
    let jornadaData = null;
    try {
      const rtdb = admin.database();
      const jornadaSnapshot = await rtdb
        .ref('jornada_activa')
        .orderByChild('activo')
        .equalTo(true)
        .once('value');

      const jornadas = jornadaSnapshot.val();
      if (jornadas) {
        const jornadaKey = Object.keys(jornadas)[0];
        jornadaData = jornadas[jornadaKey];
      }
    } catch (error) {
      console.log('Error obteniendo jornada activa:', error);
    }

    return {
      areaNombre,
      funcionNombre,
      empresaNombre,
      jornadaData,
    };
  } catch (error) {
    console.error('Error obteniendo datos relacionados:', error);
    return {
      areaNombre: 'No especificada',
      funcionNombre: 'No especificada',
      empresaNombre: 'No especificada',
      jornadaData: null,
    };
  }
}

/**
 * Generar QR code como base64
 */
async function generateQRCode(data: any): Promise<string> {
  const codigoPulsera =
    !data.codigoPulsera || data.codigoPulsera === 'SIN_PULSERA_ASIGNADA'
      ? 'SIN PULSERA ASIGNADA'
      : data.codigoPulsera;

  const qrData = {
    codigoPulsera: codigoPulsera,
    nombre: data.nombre,
    apellidoPaterno: data.apellidoPaterno,
    area: data.areaNombre,
    funcion: data.funcionNombre,
    empresa: data.empresaNombre,
    email: data.email,
  };

  return await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 200,
    margin: 1,
  });
}

/**
 * Generar PDF de constancia de acreditación
 */
async function generatePDF(userData: any, relatedData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fullName = `${userData.nombre} ${userData.apellidoPaterno}`.trim();
      const codigoPulsera =
        !userData.codigoPulsera ||
        userData.codigoPulsera === 'SIN_PULSERA_ASIGNADA'
          ? 'SIN PULSERA ASIGNADA'
          : userData.codigoPulsera;

      // Generar QR (debe ser async)
      generateQRCode({
        ...userData,
        ...relatedData,
      })
        .then((qrDataUrl) => {
          const qrBase64 = qrDataUrl.split(',')[1];
          const qrBuffer = Buffer.from(qrBase64, 'base64');

          const pageWidth = doc.page.width;
          const margin = 50;
          const contentWidth = pageWidth - margin * 2;
          const colors = {
            primary: '#0B5E3B',
            text: '#111827',
            muted: '#6B7280',
            border: '#E5E7EB',
            surface: '#F9FAFB',
            alert: '#B91C1C',
            alertSurface: '#FEF2F2',
            alertBorder: '#FCA5A5',
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
              .font('Helvetica-Bold')
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
                .font('Helvetica-Bold')
                .fillColor(colors.text)
                .text(`${row.label}: `, x + padding, currentY, {
                  continued: true,
                });
              doc.font('Helvetica').text(row.value, {
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
            .font('Helvetica-Bold')
            .fillColor('white')
            .text('CONSTANCIA UNICA DE ACREDITACION', margin, margin + 8, {
              width: contentWidth,
              align: 'center',
            });
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('white')
            .text('Sistema de Accesos - Club Leon', margin, margin + 38, {
              width: contentWidth,
              align: 'center',
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
            'DATOS DEL ACREDITADO',
            [
              { label: 'Nombre', value: fullName },
              { label: 'Area asignada', value: relatedData.areaNombre },
              { label: 'Funcion', value: relatedData.funcionNombre },
              { label: 'Empresa', value: relatedData.empresaNombre },
              { label: 'Codigo de pulsera', value: codigoPulsera },
            ],
            leftX,
            leftY,
            leftWidth
          );

          leftY += 12;

          // Seccion izquierda: datos de la jornada
          const jornadaRows = relatedData.jornadaData
            ? [
                { label: 'Jornada', value: relatedData.jornadaData.jornada },
                {
                  label: 'Partido',
                  value:
                    `${relatedData.jornadaData.equipo_local} ` +
                    `vs ${relatedData.jornadaData.equipo_visitante}`,
                },
                { label: 'Fecha', value: relatedData.jornadaData.fecha },
                { label: 'Hora', value: relatedData.jornadaData.hora },
                { label: 'Estadio', value: relatedData.jornadaData.estadio },
              ]
            : [{ label: 'Estado', value: 'No hay jornada activa disponible' }];

          leftY = drawSection(
            'DATOS DE LA JORNADA',
            jornadaRows,
            leftX,
            leftY,
            leftWidth
          );

          // Seccion derecha: QR
          const qrBoxHeight = 260;
          doc
            .roundedRect(rightX, contentTop, rightWidth, qrBoxHeight, 6)
            .fillAndStroke(colors.surface, colors.border);
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor(colors.primary)
            .text('CODIGO QR DE ACCESO', rightX + 10, contentTop + 10, {
              width: rightWidth - 20,
              align: 'center',
            });

          const qrSize = 170;
          const qrX = rightX + (rightWidth - qrSize) / 2;
          const qrY = contentTop + 40;
          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor(colors.muted)
            .text(
              'Presentar este codigo junto con identificacion oficial.',
              rightX + 10,
              qrY + qrSize + 8,
              {
                width: rightWidth - 20,
                align: 'center',
              }
            );

          // Aviso importante
          const afterColumnsY = Math.max(leftY, contentTop + qrBoxHeight) + 18;
          doc
            .roundedRect(margin, afterColumnsY, contentWidth, 150, 8)
            .fillAndStroke(colors.alertSurface, colors.alertBorder);
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(colors.alert)
            .text('AVISO IMPORTANTE', margin, afterColumnsY + 10, {
              width: contentWidth,
              align: 'center',
            });

          const avisos = [
            'El presente QR no garantiza el acceso al estadio.',
            'Para ingresar es indispensable contar con pulsera y ' +
              'realizar el proceso en el area de acreditacion.',
            'Este QR:',
            'No es un boleto.',
            'No asegura lugar en tribuna.',
            'Requiere la presentacion de identificacion oficial vigente.',
            'Es valido unicamente para el partido del dia.',
            'Es intransferible.',
            'No valido para menores de edad.',
          ];

          let avisoY = afterColumnsY + 38;
          doc.fontSize(9).font('Helvetica').fillColor(colors.text);
          avisos.forEach((aviso) => {
            const prefix = aviso === 'Este QR:' ? '' : '- ';
            doc.text(`${prefix}${aviso}`, margin + 16, avisoY, {
              width: contentWidth - 32,
            });
            avisoY = doc.y + 2;
          });

          // Footer
          doc
            .fontSize(8)
            .fillColor(colors.muted)
            .text('Sistema de Accesos - Club Leon', margin, avisoY + 14, {
              width: contentWidth,
              align: 'center',
            });
          doc.text(
            `Generado: ${new Date().toLocaleString('es-MX')}`,
            margin,
            doc.y,
            {
              width: contentWidth,
              align: 'center',
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
        contentType: 'application/pdf',
      },
    });

    // Hacer el archivo público por 7 días
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    console.log('PDF subido a Storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error subiendo PDF a Storage:', error);
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
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.error('API Key de Brevo no configurada');
      throw new Error('Brevo API Key no configurada');
    }

    const isApproved = userData.estatus === 'aprobado';
    const fullName = `${userData.nombre} ${userData.apellidoPaterno}`.trim();

    if (!isApproved) {
      // Para rechazados, solo enviar correo simple sin PDF
      await sendRejectionEmail(userData, fullName, BREVO_API_KEY);
      return;
    }

    // Obtener datos relacionados
    console.log('Obteniendo datos relacionados...');
    const relatedData = await getRelatedData(userData);

    // Generar PDF
    console.log('Generando PDF...');
    const pdfBuffer = await generatePDF(userData, relatedData);

    // Subir PDF a Storage
    console.log('Subiendo PDF a Storage...');
    const fileName = `acreditacion_${Date.now()}.pdf`;
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, userId, fileName);

    // Guardar URL en Firestore
    if (docRef) {
      await docRef.update({
        pdfUrl: pdfUrl,
        pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Preparar correo con PDF adjunto
    const pdfBase64 = pdfBuffer.toString('base64');

    const payload: BrevoPayload = {
      sender: {
        email: 'luisrosasbocanegra@gmail.com',
        name: 'Sistema de Accesos - Club León',
      },
      to: [{ email: userData.email, name: fullName }],
      subject: '✅ Constancia de Acreditación - Club León',
      htmlContent: getApprovalEmailTemplate(fullName, pdfUrl),
      attachment: [
        {
          content: pdfBase64,
          name: fileName,
        },
      ],
    };

    console.log('Enviando correo con PDF adjunto...');
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Correo enviado exitosamente:', {
      to: userData.email,
      status: response.status,
      messageId: response.data?.messageId,
      pdfUrl: pdfUrl,
    });

    if (docRef) {
      await docRef.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    const err = error as { message: string };
    console.error('Error en proceso de envío:', {
      error: err.message,
      userId: userId,
      email: userData.email,
    });

    if (docRef) {
      await docRef.update({
        emailSent: false,
        emailError: err.message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

/**
 * Enviar correo de rechazo simple
 */
async function sendRejectionEmail(
  userData: any,
  fullName: string,
  apiKey: string
) {
  const payload: BrevoPayload = {
    sender: {
      email: 'luisrosasbocanegra@gmail.com',
      name: 'Sistema de Accesos - Club León',
    },
    to: [{ email: userData.email, name: fullName }],
    subject: '❌ Solicitud de Acceso Rechazada',
    htmlContent: getRejectionEmailTemplate(fullName),
  };

  await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
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
