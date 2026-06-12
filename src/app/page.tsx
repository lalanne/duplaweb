export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#0f172a_70%)] px-8 text-center text-slate-200">
      <div className="max-w-[540px]">
        <div className="text-4xl font-bold tracking-tight">
          Dupla<span className="text-sky-400"> Consulting</span>
        </div>

        <div className="mx-auto my-6 h-[3px] w-[60px] rounded bg-sky-400" />

        <h1 className="mb-3 text-2xl font-semibold">Sitio en construcción</h1>

        <p className="text-lg leading-relaxed text-slate-400">
          Estamos trabajando en algo nuevo. Muy pronto encontrarás aquí toda la
          información sobre nuestros servicios y nuestra plataforma de
          evaluación de empleabilidad.
        </p>

        <a
          href="mailto:contacto@duplaconsulting.cl"
          className="mt-8 inline-block font-medium text-sky-400 hover:underline"
        >
          contacto@duplaconsulting.cl
        </a>
      </div>
    </main>
  );
}
