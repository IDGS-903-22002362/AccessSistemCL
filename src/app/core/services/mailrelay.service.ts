import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MailrelayPayload {
  from: {
    email: string;
    name: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  html_part: string;
  text_part: string;
  smtp_tags: string[];
}

export interface MailrelayResponse {
  status: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MailrelayService {
  private http = inject(HttpClient);
  private apiUrl = environment.mailrelay.apiUrl;
  private apiKey = environment.mailrelay.apiKey;

  /**
   * Enviar correo de solicitud ACEPTADA (PRUEBA)
   */
  sendAcceptTestEmail(email: string, name?: string): Observable<any> {
    const payload: MailrelayPayload = {
      from: {
        email: 'acreditaciones@clubleon.mx',
        name: 'Sistema de Accesos',
      },
      to: [
        {
          email: email,
          name: name || email,
        },
      ],
      subject: 'Solicitud aceptada (PRUEBA)',
      html_part: this.getAcceptHtmlTemplate(name || 'Usuario'),
      text_part: this.getAcceptTextTemplate(name || 'Usuario'),
      smtp_tags: ['test', 'access', 'approved'],
    };

    return this.sendEmail(payload);
  }

  /**
   * Enviar correo de solicitud RECHAZADA (PRUEBA)
   */
  sendRejectTestEmail(email: string, name?: string): Observable<any> {
    const payload: MailrelayPayload = {
      from: {
        email: 'acreditaciones@clubleon.mx',
        name: 'Sistema de Accesos',
      },
      to: [
        {
          email: email,
          name: name || email,
        },
      ],
      subject: 'Solicitud rechazada (PRUEBA)',
      html_part: this.getRejectHtmlTemplate(name || 'Usuario'),
      text_part: this.getRejectTextTemplate(name || 'Usuario'),
      smtp_tags: ['test', 'access', 'rejected'],
    };

    return this.sendEmail(payload);
  }

  /**
   * Método privado para enviar correo a Mailrelay
   */
  private sendEmail(payload: MailrelayPayload): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-AUTH-TOKEN': this.apiKey,
    });

    console.log('📧 Enviando correo a Mailrelay:', payload);

    return this.http.post(`${this.apiUrl}/emails`, payload, { headers });
  }

  /**
   * Template HTML para correo de ACEPTACIÓN
   */
  private getAcceptHtmlTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">✅ Solicitud Aceptada</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px;">Estimado/a <strong>${name}</strong>,</p>
          <p style="font-size: 14px;">
            Le informamos que su solicitud de acceso ha sido <strong style="color: #4CAF50;">ACEPTADA</strong>.
          </p>
          <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Estado:</strong> Aprobado<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <p style="font-size: 14px;">
            Este es un correo de prueba del sistema de gestión de accesos.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Si tiene alguna pregunta, por favor contacte al administrador del sistema.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} Sistema de Accesos - Club León</p>
          <p style="margin: 5px 0;">Este es un correo automático, por favor no responda.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template TEXTO PLANO para correo de ACEPTACIÓN
   */
  private getAcceptTextTemplate(name: string): string {
    return `
SOLICITUD ACEPTADA

Estimado/a ${name},

Le informamos que su solicitud de acceso ha sido ACEPTADA.

Estado: Aprobado
Fecha: ${new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}

Este es un correo de prueba del sistema de gestión de accesos.

Si tiene alguna pregunta, por favor contacte al administrador del sistema.

---
© ${new Date().getFullYear()} Sistema de Accesos - Club León
Este es un correo automático, por favor no responda.
    `.trim();
  }

  /**
   * Template HTML para correo de RECHAZO
   */
  private getRejectHtmlTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">❌ Solicitud Rechazada</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px;">Estimado/a <strong>${name}</strong>,</p>
          <p style="font-size: 14px;">
            Lamentamos informarle que su solicitud de acceso ha sido <strong style="color: #f44336;">RECHAZADA</strong>.
          </p>
          <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Estado:</strong> Rechazado<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <p style="font-size: 14px;">
            Este es un correo de prueba del sistema de gestión de accesos.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Si tiene alguna pregunta o desea más información, por favor contacte al administrador del sistema.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} Sistema de Accesos - Club León</p>
          <p style="margin: 5px 0;">Este es un correo automático, por favor no responda.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template TEXTO PLANO para correo de RECHAZO
   */
  private getRejectTextTemplate(name: string): string {
    return `
SOLICITUD RECHAZADA

Estimado/a ${name},

Lamentamos informarle que su solicitud de acceso ha sido RECHAZADA.

Estado: Rechazado
Fecha: ${new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}

Este es un correo de prueba del sistema de gestión de accesos.

Si tiene alguna pregunta o desea más información, por favor contacte al administrador del sistema.

---
© ${new Date().getFullYear()} Sistema de Accesos - Club León
Este es un correo automático, por favor no responda.
    `.trim();
  }
}
