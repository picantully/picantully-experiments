import type { Metadata } from "next";
import Link from "next/link";
import ContactLink from "@/components/ContactLink";

export const metadata: Metadata = {
  title: "Términos de Servicio — Picantully",
  description:
    "Condiciones de uso de Picantully Focus: el servicio, el personaje, la IA, tu cuenta, límites de uso y responsabilidades.",
};

export default function TermsPage() {
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
          Términos de Servicio — Picantully Focus
        </h1>

        <div className="text-sm text-mut2 mb-8 space-y-1">
          <p>
            <strong>Titular del servicio:</strong> Tomás Salina (persona física),
            Argentina.
          </p>
          <p>
            <strong>Contacto:</strong>{" "}
            <ContactLink className="text-red hover:underline" />
          </p>
          <p>
            <strong>Última actualización:</strong> 7 de junio de 2026
          </p>
        </div>

        <section className="space-y-8 text-mut leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              1. Aceptación
            </h2>
            <p>
              Al instalar o usar Picantully Focus (la &ldquo;extensión&rdquo; o el
              &ldquo;servicio&rdquo;) aceptás estos Términos de Servicio y nuestra{" "}
              <Link href="/privacy" className="text-red hover:underline">
                Política de Privacidad
              </Link>
              . Si no estás de acuerdo, no uses el servicio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              2. Qué es el servicio
            </h2>
            <p>
              Picantully Focus es una extensión de navegador que te ayuda a
              enfocarte: bloquea los sitios que vos elegís e inserta un personaje
              de inteligencia artificial (&ldquo;El Picante&rdquo;) con el que
              negociás acceso temporal. Es una{" "}
              <strong>herramienta de productividad y bienestar digital</strong>,
              no una garantía de resultados.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              3. Elegibilidad
            </h2>
            <p>
              Para usar Picantully Focus tenés que ser{" "}
              <strong>mayor de 18 años</strong>. El personaje usa lenguaje fuerte
              como recurso de humor (ver sección 4) y el servicio no está dirigido
              a menores. Al usarlo, declarás que tenés la edad requerida y la
              capacidad legal para aceptar estos Términos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              4. Naturaleza del personaje y del contenido (IMPORTANTE)
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>
                  &ldquo;El Picante&rdquo; es un personaje de ficción y humor.
                </strong>{" "}
                Usa intencionalmente un tono provocador, sarcástico y lenguaje
                fuerte (incluyendo insultos en clave de comedia) como parte de la
                experiencia de entretenimiento.
              </li>
              <li>
                <strong>
                  Al usar Picantully Focus consentís expresamente ese tono.
                </strong>{" "}
                No constituye acoso, hostigamiento ni una opinión real sobre vos;
                es un recurso humorístico cuyo único fin es motivarte a recuperar
                el foco.
              </li>
              <li>
                Si el tono no es para vos, podés dejar de usar la extensión en
                cualquier momento.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              5. Naturaleza de la inteligencia artificial
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Las respuestas de El Picante son{" "}
                <strong>generadas por IA</strong> (Google Gemini) y pueden ser
                inexactas, inapropiadas o impredecibles.
              </li>
              <li>
                <strong>No constituyen asesoramiento</strong> de ningún tipo
                (profesional, médico, legal, financiero, psicológico, etc.).
              </li>
              <li>
                La decisión de conceder o negar acceso es parte de un juego de
                productividad y no debe interpretarse como un juicio real sobre
                vos.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Tu cuenta</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Necesitás registrarte con un email (código de un solo uso) o con
                Google.
              </li>
              <li>
                Sos responsable de la actividad de tu cuenta y de mantener seguro
                el acceso a tu email.
              </li>
              <li>Una sola persona por cuenta. No compartas tus credenciales.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              7. Uso aceptable
            </h2>
            <p className="mb-2">Te comprometés a no:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Abusar del servicio, automatizar peticiones o intentar evadir los
                límites de uso.
              </li>
              <li>
                Usar el servicio para fines ilícitos o para vulnerar derechos de
                terceros.
              </li>
              <li>
                Intentar acceder sin autorización, vulnerar la seguridad o
                interferir con el funcionamiento del servicio o su
                infraestructura.
              </li>
              <li>
                Realizar ingeniería inversa, descompilar o crear obras derivadas
                del software, salvo en la medida en que la ley lo permita.
              </li>
            </ul>
            <p className="mt-3">
              El servicio aplica <strong>límites de uso</strong> (negociaciones
              por sitio, por día y por semana) que podemos ajustar para proteger
              su funcionamiento y su costo.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              8. Tu contenido
            </h2>
            <p>
              Conservás la titularidad de los mensajes que escribís al negociar.
              Nos otorgás una licencia limitada, no exclusiva y mundial para
              procesar esos mensajes con el único fin de operar el servicio (por
              ejemplo, enviarlos al proveedor de IA para generar la respuesta de
              El Picante). No usamos tu contenido para entrenar modelos propios.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              9. Planes y pagos
            </h2>
            <p>
              Picantully Focus ofrece un plan gratuito con límites de uso. Podremos
              ofrecer planes pagos (&ldquo;Premium&rdquo;) en el futuro; cuando
              habilitemos el cobro, publicaremos las condiciones de precios,
              facturación, renovación y reembolsos aplicables, que pasarán a formar
              parte de estos Términos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              10. Propiedad intelectual
            </h2>
            <p>
              El software, la marca &ldquo;Picantully&rdquo;, el personaje
              &ldquo;El Picante&rdquo; y los contenidos del servicio son de Tomás
              Salina o de sus licenciantes y están protegidos por las leyes de
              propiedad intelectual. No se te otorga ningún derecho sobre ellos
              salvo el de usar el servicio conforme a estos Términos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              11. Sin garantías
            </h2>
            <p>
              El servicio se ofrece{" "}
              <strong>
                &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;
              </strong>
              , sin garantías de ningún tipo, expresas o implícitas. No
              garantizamos disponibilidad ininterrumpida, ausencia de errores, ni
              que mejore tu productividad o tu foco.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              12. Limitación de responsabilidad
            </h2>
            <p>
              En la máxima medida permitida por la ley, Tomás Salina no será
              responsable por daños indirectos, incidentales, especiales o
              consecuentes, ni por pérdida de productividad, tiempo, datos u
              oportunidades, derivados del uso o de la imposibilidad de uso del
              servicio. En la medida en que exista responsabilidad, su límite
              total será el mayor entre el monto que hayas pagado por el servicio
              en los 12 meses previos o USD 20.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              13. Indemnidad
            </h2>
            <p>
              Aceptás mantener indemne a Tomás Salina frente a reclamos de terceros
              derivados de tu uso indebido del servicio o de tu incumplimiento de
              estos Términos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              14. Suspensión y terminación
            </h2>
            <p>
              Podemos suspender o terminar tu acceso ante incumplimientos de estos
              Términos o ante usos que pongan en riesgo el servicio. Vos podés
              dejar de usar el servicio y solicitar la eliminación de tu cuenta
              cuando quieras, escribiendo a{" "}
              <ContactLink className="text-red hover:underline" />.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              15. Modificaciones del servicio
            </h2>
            <p>
              Podemos modificar, suspender o discontinuar funciones del servicio
              en cualquier momento. Haremos lo razonable por avisar los cambios
              importantes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              16. Cambios a estos Términos
            </h2>
            <p>
              Podemos modificar estos Términos. Publicaremos la versión vigente
              con su fecha; el uso continuado del servicio luego de un cambio
              implica su aceptación.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              17. Ley aplicable y jurisdicción
            </h2>
            <p>
              Estos Términos se rigen por las leyes de la{" "}
              <strong>República Argentina</strong>. Cualquier controversia se
              someterá a los tribunales ordinarios competentes de la{" "}
              <strong>Ciudad Autónoma de Buenos Aires</strong>, renunciando a
              cualquier otro fuero que pudiera corresponder.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              18. Plazo para reclamar
            </h2>
            <p>
              Todo reclamo derivado del uso del servicio deberá presentarse dentro
              del <strong>plazo de un (1) año</strong> desde el hecho que lo
              origine; vencido ese plazo, el reclamo quedará prescripto, en la
              medida en que la ley lo permita.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink mb-3">
              19. Contacto
            </h2>
            <p>
              Consultas:{" "}
              <ContactLink className="text-red hover:underline" />.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
