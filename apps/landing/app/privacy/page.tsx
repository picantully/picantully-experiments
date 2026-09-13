import type { Metadata } from "next";
import Link from "next/link";
import ContactLink from "@/components/ContactLink";

export const metadata: Metadata = {
  title: "Política de Privacidad — Picantully",
  description:
    "Cómo Picantully Focus trata tus datos: qué guardamos, qué se queda en tu navegador, con quién lo compartimos y tus derechos.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-sm text-red hover:underline mb-8 inline-block"
      >
        ← Volver al inicio
      </Link>

      <article className="max-w-none">
        <h1 className="disp text-3xl font-bold text-ink mb-6">
          Política de Privacidad — Picantully Focus
        </h1>

        <div className="text-sm text-mut2 mb-8 space-y-1">
          <p>
            <strong>Responsable del tratamiento:</strong> Tomás Salina (persona
            física), Argentina.
          </p>
          <p>
            <strong>Contacto de privacidad:</strong>{" "}
            <ContactLink className="text-red hover:underline" />
          </p>
          <p>
            <strong>Última actualización:</strong> 7 de junio de 2026
          </p>
        </div>

        <p className="text-mut leading-relaxed mb-8">
          Esta Política de Privacidad describe, con precisión y en lenguaje
          claro, qué datos trata Picantully Focus (la &ldquo;extensión&rdquo; o
          el &ldquo;servicio&rdquo;), con qué finalidad, con quién se comparten y
          qué derechos tenés sobre ellos. Está redactada para reflejar
          exactamente el comportamiento real del producto y para cumplir con la
          Política de Datos de Usuario de Chrome Web Store, incluido el requisito
          de <strong>Uso Limitado (Limited Use)</strong>.
        </p>

        <section className="space-y-8 text-mut leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              1. Propósito único del servicio
            </h2>
            <p>
              Picantully Focus es una extensión de navegador anti-distracción.
              Su <strong>único propósito</strong> es ayudarte a recuperar el
              foco: bloquea los sitios que vos elegís e inserta un personaje
              (&ldquo;El Picante&rdquo;) con el que{" "}
              <strong>negociás acceso temporal</strong> mediante inteligencia
              artificial. Todo el tratamiento de datos descrito aquí existe para
              hacer funcionar esa única finalidad.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              2. Qué datos tratamos (y cuáles NO)
            </h2>
            <p className="font-medium mb-2">
              2.1. Datos que se guardan SOLO en tu navegador (nunca llegan a
              nuestros servidores)
            </p>
            <p className="mb-2">
              Se almacenan localmente en tu dispositivo y{" "}
              <strong>no se transmiten a nuestros servidores</strong>. Podés
              borrarlos cuando quieras (ver sección 9):
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Tu lista de sitios bloqueados.</li>
              <li>
                El tiempo que pasás en cada sitio bloqueado por día (últimos 7
                días).
              </li>
              <li>
                El historial de tus conversaciones con El Picante (hasta las
                últimas ~10 idas y vueltas por sitio).
              </li>
              <li>Los permisos temporales de acceso concedidos y su
                vencimiento.</li>
              <li>Una copia local de tus contadores de uso.</li>
            </ul>

            <p className="font-medium mb-2">
              2.2. Datos que tratamos en nuestros servidores (Appwrite)
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>
                <strong>Email</strong> — para crear tu cuenta e iniciar sesión
                (código de un solo uso o Google).
              </li>
              <li>
                <strong>Identificador de cuenta y, si usás Google, tu
                nombre</strong> — datos básicos del proveedor de autenticación.
              </li>
              <li>
                <strong>Perfil</strong> — identificador, idioma/región (por
                defecto <code>es-AR</code>), estado de onboarding y los datos que
                cargás en el onboarding: <strong>nombre y apellido, fecha de
                nacimiento y género</strong> (el género es opcional), tu{" "}
                <strong>ocupación</strong> (estudio/trabajo y, si corresponde,
                qué estudiás o en qué trabajás) y la <strong>intensidad</strong>{" "}
                que elegís para El Picante.
              </li>
              <li>
                <strong>Contadores de uso</strong> — la cantidad de
                negociaciones por día y por sitio, solo para aplicar los límites.{" "}
                <strong>
                  No guardamos el contenido de tus negociaciones en nuestros
                  servidores.
                </strong>
              </li>
              <li>
                <strong>Interés en funciones premium</strong> y, si elegís
                enviarlo, tu feedback de producto.
              </li>
            </ul>

            <p className="font-medium mb-2">2.3. Datos que NO tratamos</p>
            <p>
              No recolectamos información de salud, financiera o de pago,
              ubicación precisa, contraseñas (usamos código de un solo uso y
              OAuth; nunca guardamos una contraseña), ni el contenido de las
              páginas que visitás. Tampoco rastreamos tu navegación general: solo
              conocemos los dominios que <strong>vos</strong> decidiste bloquear,
              en el momento de una negociación.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              3. Permisos de la extensión y por qué los pedimos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-ink border-b border-[rgba(255,245,241,0.15)]">
                    <th className="py-2 pr-4 font-semibold">Permiso</th>
                    <th className="py-2 font-semibold">Para qué lo usamos</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {[
                    ["storage", "Guardar localmente tu lista de bloqueo, tiempos, conversaciones y permisos temporales en tu dispositivo."],
                    ["tabs", "Detectar cuándo navegás a un sitio bloqueado para mostrar la pantalla de negociación."],
                    ["offscreen", "Ejecutar la comunicación con nuestro backend de forma estable durante el inicio de sesión y la negociación."],
                    ["identity", "Permitir el inicio de sesión con Google de forma segura (flujo OAuth del navegador)."],
                    ["Permisos de host (https://*/*, http://*/*)", "El bloqueo y la negociación deben poder activarse en cualquier sitio que vos elijas bloquear. Solo actuamos sobre los dominios que vos agregaste a tu lista."],
                    ["Acceso a *.cloud.appwrite.io", "Comunicarnos con nuestro backend (autenticación, contadores de uso, negociación)."],
                  ].map(([perm, use]) => (
                    <tr
                      key={perm}
                      className="border-b border-[rgba(255,245,241,0.08)]"
                    >
                      <td className="py-2 pr-4 font-mono text-[12.5px] text-ink whitespace-nowrap">
                        {perm}
                      </td>
                      <td className="py-2">{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-mut2">
              El acceso amplio a sitios <strong>no</strong> se usa para leer,
              recolectar ni transmitir el contenido de las páginas que visitás.
              Se usa únicamente para insertar la pantalla de negociación en los
              sitios que vos bloqueaste.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              4. Las conversaciones y la inteligencia artificial
            </h2>
            <p className="mb-2">
              Cuando negociás con El Picante, para generar su respuesta enviamos a
              Google (modelo <strong>Gemini</strong>) lo mínimo necesario:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                El nombre del dominio bloqueado (ej. <code>instagram.com</code>;
                nunca la URL completa, ni la ruta, ni el contenido de la página).
              </li>
              <li>
                Los minutos que pasaste hoy en ese sitio y el número de intento.
              </li>
              <li>
                El texto de tu mensaje (máximo 500 caracteres) y hasta los últimos
                8 turnos de esa conversación, para dar contexto.
              </li>
              <li>
                Para que El Picante te hable a vos y no como un robot, también
                enviamos algunos <strong>datos de tu perfil</strong>: tu{" "}
                <strong>nombre</strong>, tu <strong>género</strong> (para usar el
                trato correcto), si <strong>estudiás o trabajás</strong> (y de qué,
                si lo cargaste) y la <strong>intensidad</strong> elegida.
              </li>
            </ul>
            <p className="mt-3">
              Lo que <strong>no</strong> enviamos a Google: tu apellido, tu email,
              tu fecha de nacimiento ni tu identificador de cuenta.{" "}
              <strong>
                No persistimos el contenido de tus mensajes en nuestros
                servidores
              </strong>
              ; el historial vive en tu navegador. El procesamiento por parte de
              Google se rige por las políticas de Google. Te recomendamos no
              incluir información sensible o confidencial en tus mensajes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              5. Para qué usamos los datos (finalidades)
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Autenticarte y mantener tu sesión iniciada.</li>
              <li>Hacer funcionar el bloqueo y la negociación.</li>
              <li>
                Aplicar los límites de uso (por sitio, por día y por semana) para
                proteger el servicio del abuso y sostener su costo.
              </li>
              <li>
                Comunicarnos con vos mediante emails transaccionales (código de
                acceso, confirmación de lista de espera).
              </li>
              <li>Entender de forma agregada cómo se usa el producto para
                mejorarlo.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              6. Uso Limitado y cumplimiento de Chrome Web Store
            </h2>
            <p className="mb-2">
              El uso que hacemos de la información recibida de las APIs de Google
              se ajusta a la{" "}
              <strong>
                Política de Datos de Usuario de Chrome Web Store, incluidos los
                requisitos de Uso Limitado (Limited Use)
              </strong>
              . En concreto:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>No vendemos</strong> tus datos personales ni los
                transferimos a corredores de datos o plataformas publicitarias.
              </li>
              <li>
                <strong>No usamos</strong> tus datos para publicidad
                personalizada de ningún tipo.
              </li>
              <li>
                <strong>No usamos</strong> tus datos para determinar solvencia
                crediticia ni con fines de préstamo.
              </li>
              <li>Limitamos el uso de los datos a las finalidades de esta
                política.</li>
              <li>
                Ninguna persona humana lee tus datos, salvo con tu consentimiento
                explícito, para operaciones internas sobre datos agregados o
                anonimizados, por motivos de seguridad, o cuando lo exija la ley.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              7. Terceros y dónde se almacenan los datos
            </h2>
            <p className="mb-3">
              Trabajamos con proveedores (subprocesadores) que pueden tratar datos
              fuera de tu país. Cada uno recibe solo lo necesario:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-ink border-b border-[rgba(255,245,241,0.15)]">
                    <th className="py-2 pr-4 font-semibold">Proveedor</th>
                    <th className="py-2 pr-4 font-semibold">Qué recibe</th>
                    <th className="py-2 font-semibold">Dónde</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {[
                    ["Appwrite (backend, auth, base de datos)", "Tu cuenta (email, nombre, identificador, sesiones), perfil mínimo y contadores de uso.", "EE.UU. (región NYC)"],
                    ["Google — Gemini (IA)", "Dominio bloqueado, minutos en el sitio, número de intento, tu mensaje y los últimos turnos. Sin datos de identidad.", "Infra. de Google"],
                    ["Google — OAuth (login opcional)", "Lo que Google procesa al iniciar sesión, si elegís usar Google. Alcance básico (email, profile).", "Infra. de Google"],
                    ["Resend (emails)", "Tu dirección de email y el contenido del email que te enviamos.", "Infra. de Resend"],
                    ["Vercel (alojamiento web)", "Metadatos técnicos de las solicitudes (IP, registros del servidor).", "Infra. de Vercel"],
                  ].map(([prov, recv, where]) => (
                    <tr
                      key={prov}
                      className="border-b border-[rgba(255,245,241,0.08)]"
                    >
                      <td className="py-2 pr-4 font-medium text-ink">{prov}</td>
                      <td className="py-2 pr-4">{recv}</td>
                      <td className="py-2 whitespace-nowrap">{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              <strong>Transferencias internacionales:</strong> como algunos
              proveedores operan fuera de Argentina, tus datos pueden transferirse
              al exterior para prestarte el servicio que solicitás.
            </p>
            <p className="mt-2 text-sm text-mut2">
              No usamos servicios de analítica, seguimiento publicitario ni
              reproducción de sesión en nuestro sitio ni en la extensión.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              8. Sincronización en la nube (opcional, a futuro)
            </h2>
            <p>
              Hoy, tu lista de bloqueo, tiempos, conversaciones y permisos
              temporales viven <strong>solo</strong> en tu dispositivo. Si en el
              futuro habilitás de forma explícita la sincronización entre
              dispositivos, esos datos se almacenarían también en nuestros
              servidores (Appwrite) con el único fin de sincronizarlos, bajo esta
              misma política. La sincronización nunca se activa sin tu acción.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              9. Tus datos locales: cómo borrarlos
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Podés borrar la data local desde las opciones de la extensión, o
                quitando y reinstalando la extensión.
              </li>
              <li>
                Al cerrar sesión se limpia tu sesión del dispositivo. Si en el
                mismo navegador inicia sesión otra persona, los datos locales del
                usuario anterior se eliminan automáticamente para evitar que se
                mezclen.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              10. Conservación
            </h2>
            <p>
              Conservamos los datos de cuenta y los contadores de uso mientras tu
              cuenta esté activa. Si solicitás la eliminación de tu cuenta,
              borramos los datos asociados, salvo los que debamos conservar por
              obligación legal. Podés solicitar la baja escribiendo a{" "}
              <ContactLink className="text-red hover:underline" />.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              11. Tus derechos (Argentina — Ley 25.326)
            </h2>
            <p>
              Tenés derecho a{" "}
              <strong>acceder, rectificar, actualizar y suprimir</strong> tus
              datos personales. Para ejercerlos, escribí a{" "}
              <ContactLink className="text-red hover:underline" /> y te
              responderemos en los plazos legales. La autoridad de control en
              Argentina es la{" "}
              <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>,
              ante la cual podés presentar reclamos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">12. Menores</h2>
            <p>
              Picantully Focus está dirigido a{" "}
              <strong>personas mayores de 18 años</strong>. El personaje &ldquo;El
              Picante&rdquo; usa de forma intencional un tono provocador y
              lenguaje fuerte como recurso de humor, por lo que el servicio no es
              apto para menores. No recolectamos conscientemente datos de menores;
              si detectamos una cuenta de un menor, la eliminaremos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              13. Seguridad
            </h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger
              tus datos (cifrado en tránsito, acceso restringido). Ningún sistema
              es 100% seguro, pero trabajamos para minimizar los riesgos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              14. Cambios a esta política
            </h2>
            <p>
              Podemos actualizar esta política. Publicaremos la versión vigente
              con su fecha y, ante cambios significativos, lo comunicaremos de
              forma razonable.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              15. Contacto
            </h2>
            <p>
              Por dudas, solicitudes o para ejercer tus derechos, escribinos a{" "}
              <ContactLink className="text-red hover:underline" />.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
