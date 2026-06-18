import Image from "next/image";
import Link from "next/link";

// NOTE: The services below are PLACEHOLDERS based on the employability + tech
// direction. Replace the titles/descriptions with Dupla Consulting's real
// offerings (see the `services` array).
const services = [
  {
    title: "Evaluación de Empleabilidad",
    description:
      "Plataforma de tests para medir competencias, habilidades y el potencial de empleabilidad de cada candidato.",
  },
  {
    title: "Selección y Reclutamiento",
    description:
      "Procesos de selección basados en datos y evaluaciones objetivas para encontrar al talento adecuado.",
  },
  {
    title: "Capacitación y Desarrollo",
    description:
      "Programas de formación diseñados para potenciar el talento y cerrar brechas de competencias.",
  },
  {
    title: "Consultoría en Recursos Humanos",
    description:
      "Asesoría estratégica en gestión de personas, clima organizacional y desarrollo del talento.",
  },
  {
    title: "Soluciones Tecnológicas",
    description:
      "Desarrollo de plataformas digitales a medida que automatizan y modernizan tus procesos.",
  },
  {
    title: "Análisis de Datos",
    description:
      "Reportes e insights accionables para tomar mejores decisiones sobre tu capital humano.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#16235C]">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Image
          src="/logo.png"
          alt="Dupla Consulting"
          width={1214}
          height={1366}
          priority
          className="h-24 w-auto sm:h-28"
        />
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-8">
          <a href="#servicios" className="hidden hover:text-[#1E63E9] sm:inline">
            Servicios
          </a>
          <a href="#nosotros" className="hidden hover:text-[#1E63E9] sm:inline">
            Nosotros
          </a>
          <a href="#contacto" className="hidden hover:text-[#1E63E9] sm:inline">
            Contacto
          </a>
          <Link href="/ingresar" className="hover:text-[#1E63E9]">
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="rounded-full bg-[#1E63E9] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#1a55c7]"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-28">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Impulsamos el talento con{" "}
          <span className="text-[#1E63E9]">datos y tecnología</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          En Dupla Consulting combinamos la evaluación de empleabilidad con
          soluciones tecnológicas para ayudar a las personas y organizaciones a
          alcanzar su máximo potencial.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#servicios"
            className="rounded-full bg-[#1E63E9] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
          >
            Nuestros servicios
          </a>
          <a
            href="#contacto"
            className="rounded-full border border-[#16235C]/20 px-6 py-3 text-sm font-semibold transition-colors hover:bg-slate-50"
          >
            Contáctanos
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Nuestros Servicios
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Soluciones integrales para la gestión y el desarrollo del talento.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 h-1.5 w-10 rounded-full bg-[#1E63E9]" />
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="nosotros" className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Quiénes Somos
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Dupla Consulting es una consultora que une la experiencia en gestión
            de personas con la innovación tecnológica. Acompañamos a empresas e
            instituciones en la evaluación, selección y desarrollo de su capital
            humano, entregando soluciones basadas en evidencia.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="bg-[#16235C] py-20 text-white sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Conversemos
          </h2>
          <p className="mt-4 text-lg text-slate-200">
            ¿Quieres saber cómo podemos ayudarte? Escríbenos.
          </p>
          <a
            href="mailto:contacto@duplaconsulting.cl"
            className="mt-8 inline-block rounded-full bg-[#1E63E9] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
          >
            contacto@duplaconsulting.cl
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto w-full max-w-6xl px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Dupla Consulting. Todos los derechos
          reservados.
        </div>
      </footer>
    </div>
  );
}
