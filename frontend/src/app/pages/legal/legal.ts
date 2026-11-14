import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

type Documento = 'privacidad' | 'terminos';

// Pagina de contenido legal. Reutiliza una sola plantilla para la Politica de
// Privacidad y los Terminos y Condiciones, segun el parametro `data.documento`
// definido en las rutas. Asi se evita duplicar el diseño y el codigo.
@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-app">
      <div class="legal-wrap">
        <a routerLink="/" class="back-link">← Volver al inicio</a>

        @if (documento === 'privacidad') {
          <h1 class="page-title legal-title">Política de Privacidad</h1>
          <p class="legal-meta">Última actualización: noviembre de 2026</p>

          <div class="card-uber legal-card">
            <p>
              Esta Política de Privacidad describe cómo <strong>DeudoresTienda</strong>
              (en adelante, «la Aplicación») trata la información cuando usted la utiliza.
              La Aplicación es un sistema de gestión de clientes, ventas, deudas y abonos.
            </p>

            <h2>1. Responsable</h2>
            <p>
              La Aplicación es un proyecto personal desarrollado y administrado por su autor.
              Para cualquier consulta relacionada con esta política o con sus datos puede
              escribir a
              <a href="mailto:folgarever19@gmail.com">folgarever19&#64;gmail.com</a>.
            </p>

            <h2>2. Qué información se trata</h2>
            <ul>
              <li>
                <strong>Datos de la cuenta de usuario:</strong> nombres, apellidos, correo
                electrónico, nombre de usuario y contraseña (almacenada únicamente cifrada
                con bcrypt; nunca en texto plano).
              </li>
              <li>
                <strong>Datos que usted registra sobre sus clientes:</strong> nombre,
                apellido, notas u observaciones, compras, abonos, montos y saldos. Estos
                datos los ingresa y controla usted como usuario de la Aplicación.
              </li>
            </ul>

            <h2>3. Para qué se usa</h2>
            <p>
              La información se utiliza exclusivamente para operar las funciones de la
              Aplicación: autenticar su acceso y gestionar clientes, ventas, deudas y abonos.
              No se usa para publicidad, no se vende ni se comparte con terceros con fines
              comerciales.
            </p>

            <h2>4. Dónde se almacena y quién lo procesa</h2>
            <p>
              Los datos se guardan en una base de datos <strong>PostgreSQL</strong> alojada en
              <strong>Supabase</strong>. La interfaz se publica mediante <strong>Vercel</strong>.
              Ambos son proveedores externos de infraestructura («encargados del tratamiento»)
              que alojan la información por cuenta del responsable. La conexión se realiza
              cifrada mediante HTTPS/TLS.
            </p>
            <p>
              La tipografía <strong>Inter</strong> se carga desde <strong>Google Fonts</strong>.
              Al solicitarla, el navegador se conecta a servidores de Google, que pueden
              registrar la dirección IP y datos técnicos de la solicitud.
            </p>

            <h2>5. Cookies y almacenamiento local</h2>
            <p>
              La Aplicación <strong>no utiliza cookies</strong>. Para funcionar guarda datos en
              el almacenamiento local del navegador (<em>localStorage</em>): el token de sesión,
              los datos básicos del usuario, la preferencia de tema (claro/oscuro) y la
              dirección de la API. Esta información permanece en su dispositivo y no se
              envía a terceros.
            </p>

            <h2>6. Conservación</h2>
            <p>
              La información se conserva mientras exista la cuenta y se utilice la Aplicación.
              Los clientes que usted registra pueden desactivarse (borrado lógico) para
              preservar el historial financiero; si necesita la eliminación definitiva de
              datos, solicítelo al correo de contacto.
            </p>

            <h2>7. Sus derechos</h2>
            <p>
              Puede solicitar el acceso, la corrección, la actualización o la eliminación de
              la información asociada a su cuenta escribiendo a
              <a href="mailto:folgarever19@gmail.com">folgarever19&#64;gmail.com</a>.
              También puede editar sus datos personales y cambiar su contraseña desde la
              sección «Mi Perfil».
            </p>

            <h2>8. Seguridad</h2>
            <p>
              Se aplican medidas razonables: contraseñas cifradas, sesiones con token,
              límite de intentos de acceso, aislamiento de los datos por cuenta de usuario y
              conexiones cifradas. Ninguna medida es infalible; si detecta un problema de
              seguridad, repórtelo al correo de contacto.
            </p>

            <h2>9. Menores de edad</h2>
            <p>
              La Aplicación no está dirigida a menores de edad ni recopila conscientemente
              datos de menores.
            </p>

            <h2>10. Cambios</h2>
            <p>
              Esta política puede actualizarse para reflejar cambios en la Aplicación o en la
              normativa aplicable. La versión vigente será siempre la publicada en esta página.
            </p>

            <hr class="divider">
            <p class="legal-note">
              Este documento tiene carácter informativo y busca describir de forma honesta el
              funcionamiento real de la Aplicación. No constituye asesoría legal. Si va a
              abrir la Aplicación al público o a ofrecer servicios a terceros, conviene que
              un profesional del derecho revise estos textos y las obligaciones aplicables.
            </p>
          </div>
        } @else {
          <h1 class="page-title legal-title">Términos y Condiciones</h1>
          <p class="legal-meta">Última actualización: noviembre de 2026</p>

          <div class="card-uber legal-card">
            <p>
              Estos Términos y Condiciones regulan el uso de <strong>DeudoresTienda</strong>
              (en adelante, «la Aplicación»). Al utilizarla, usted acepta lo aquí descrito.
            </p>

            <h2>1. Descripción del servicio</h2>
            <p>
              La Aplicación es un sistema informático para el registro y control de clientes,
              ventas, deudas y abonos de una tienda. Se ofrece como herramienta de apoyo; no
              constituye un servicio contable, financiero ni legal.
            </p>

            <h2>2. Uso responsable de la información</h2>
            <p>
              Usted es responsable de la información que registra, incluidos los datos
              personales de sus clientes. Al ingresarlos, declara contar con legitimidad para
              tratarlos y comprometerse a darles un uso lícito.
            </p>

            <h2>3. Cuenta y seguridad</h2>
            <p>
              Usted es responsable de mantener la confidencialidad de su contraseña y de la
              actividad realizada con su cuenta. Notifique de inmediato cualquier uso no
              autorizado.
            </p>

            <h2>4. Exactitud de los datos</h2>
            <p>
              Los cálculos, saldos y reportes dependen de la información ingresada. Aunque la
              Aplicación aplica validaciones, usted debe verificar la exactitud de los datos
              antes de tomar decisiones. La Aplicación no sustituye la revisión humana.
            </p>

            <h2>5. Propiedad intelectual</h2>
            <p>
              El código, el diseño, el logotipo y la identidad visual de la Aplicación
              pertenecen a su autor. Los datos que usted ingresa siguen siendo suyos.
            </p>

            <h2>6. Limitación de responsabilidad</h2>
            <p>
              La Aplicación se ofrece «tal cual» y «según disponibilidad». En la medida en que
              la ley lo permita, el autor no responde por daños derivados de la pérdida de
              datos, de decisiones tomadas con base en la información mostrada, o de
              interrupciones del servicio. Se recomienda mantener respaldos de la información
              importante.
            </p>

            <h2>7. Uso aceptable</h2>
            <p>
              No debe utilizarse la Aplicación para fines ilícitos, para vulnerar la seguridad
              del sistema, ni para almacenar información que no tenga derecho a tratar.
            </p>

            <h2>8. Disponibilidad y cambios</h2>
            <p>
              La Aplicación puede modificarse, suspenderse o descontinuarse. Estos términos
              pueden actualizarse; la versión vigente será la publicada en esta página.
            </p>

            <h2>9. Ley aplicable y contacto</h2>
            <p>
              Estos términos se interpretan conforme a las leyes de la República de Guatemala,
              sin perjuicio de las normas de protección al consumidor u otras que resulten
              aplicables. Para cualquier consulta escriba a
              <a href="mailto:folgarever19@gmail.com">folgarever19&#64;gmail.com</a>.
            </p>

            <hr class="divider">
            <p class="legal-note">
              Este documento tiene carácter informativo y no constituye asesoría legal. Si va a
              abrir la Aplicación al público o a ofrecer servicios a terceros, conviene que un
              profesional del derecho revise estos textos y las obligaciones aplicables.
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .legal-wrap {
      max-width: 820px;
      margin: 0 auto;
      animation: fade-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .back-link {
      font-size: 13px;
      text-decoration: underline;
      color: var(--color-gray-dark);
      display: inline-block;
      margin-bottom: 18px;
    }
    .legal-title { margin-bottom: 4px; }
    .legal-meta {
      font-size: 13px;
      color: var(--color-gray-secondary);
      margin-bottom: 20px;
    }
    .legal-card { padding: clamp(20px, 3vw, 34px); }
    .legal-card h2 {
      font-size: 17px;
      margin: 26px 0 8px;
    }
    .legal-card h2:first-of-type { margin-top: 4px; }
    .legal-card p {
      color: var(--color-gray-secondary);
      font-size: 14.5px;
      line-height: 1.7;
      margin-bottom: 10px;
    }
    .legal-card ul {
      margin: 0 0 12px;
      padding-left: 22px;
      color: var(--color-gray-secondary);
      font-size: 14.5px;
      line-height: 1.7;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .legal-card a {
      color: var(--color-black);
      font-weight: 600;
      text-decoration: underline;
    }
    .legal-note {
      font-size: 13px !important;
      color: var(--color-gray-secondary);
      font-style: italic;
    }
  `]
})
export class LegalComponent implements OnInit {
  private route = inject(ActivatedRoute);

  documento: Documento = 'privacidad';

  ngOnInit(): void {
    const valor = this.route.snapshot.data['documento'];
    this.documento = valor === 'terminos' ? 'terminos' : 'privacidad';
  }
}
