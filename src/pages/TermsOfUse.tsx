import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import meteoraLogo from '@/assets/logo-white-pink.png';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link to="/"><img src={meteoraLogo} alt="Meteora Academy" className="h-6 md:h-8" /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver</Link>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Términos de Uso</h1>
          <p className="text-muted-foreground mb-8">Última actualización: 16/02/2026</p>

          <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
            <p>Bienvenido a Meteora Academy. Estos Términos de Uso regulan el acceso y utilización del sitio web https://meteora.academy/ y de todos los servicios, productos digitales, programas educativos, mentorías, eventos y herramientas ofrecidas por Meteora Academy. Al acceder o utilizar nuestros servicios, usted acepta cumplir con estos Términos.</p>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Identificación del Servicio</h2>
              <p>Meteora Academy ofrece cursos digitales, programas de aceleración, mentorías individuales y grupales, consultorías estratégicas, eventos en vivo y virtuales, herramientas y soluciones tecnológicas. Todos los servicios tienen carácter educativo y formativo.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">2. Aceptación de los Términos</h2>
              <p>El acceso al sitio y la contratación de cualquier servicio implica que el usuario ha leído estos Términos, comprende su contenido y acepta todas las condiciones aquí descritas. Si no está de acuerdo, debe abstenerse de utilizar nuestros servicios.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Requisitos del Usuario</h2>
              <p>Para utilizar nuestros servicios, el usuario declara que tiene al menos 18 años o capacidad legal para contratar, proporciona información veraz y actualizada, y utilizará la plataforma de manera ética y legal. Meteora Academy podrá suspender cuentas que incumplan estas condiciones.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">4. Naturaleza del Servicio y Limitación de Garantías</h2>
              <p>Los servicios ofrecidos son educativos y estratégicos. No garantizamos resultados financieros específicos, incrementos de ingresos, éxito empresarial ni resultados automáticos. Los resultados dependen exclusivamente de la ejecución, disciplina y contexto del usuario.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Registro y Acceso a la Plataforma</h2>
              <p>Cuando aplique, el usuario deberá crear una cuenta con credenciales personales. El acceso es individual, intransferible y limitado al titular de la cuenta. Está prohibido compartir accesos. El incumplimiento podrá resultar en cancelación inmediata sin derecho a reembolso.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Pagos y Condiciones Comerciales</h2>
              <p>Los precios, formas de pago y condiciones específicas se informan al momento de la contratación. Al realizar el pago, el usuario acepta el alcance del servicio adquirido, las condiciones comerciales y las políticas de reembolso aplicables. Los pagos no son reembolsables salvo disposición expresa en la oferta comercial o exigencia legal.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">7. Propiedad Intelectual</h2>
              <p>Todo el contenido disponible en Meteora Academy es propiedad exclusiva de la empresa, incluyendo metodologías, estructuras estratégicas, material audiovisual, presentaciones, sistemas, software y documentación. Queda prohibido copiar, reproducir, distribuir, revender, adaptar o utilizar con fines comerciales sin autorización expresa y por escrito. Las infracciones podrán dar lugar a acciones legales.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">8. Conducta del Usuario</h2>
              <p>El usuario se compromete a no utilizar la plataforma con fines ilegales, difundir contenido ofensivo o perjudicial, intentar vulnerar la seguridad del sistema ni compartir material protegido. Meteora Academy se reserva el derecho de suspender el acceso en caso de incumplimiento.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">9. Limitación de Responsabilidad</h2>
              <p>Meteora Academy no será responsable por decisiones tomadas por el usuario, pérdidas económicas derivadas de la aplicación del contenido, fallos técnicos externos ni interrupciones temporales del servicio. La responsabilidad máxima de la empresa, cuando aplique, estará limitada al monto pagado por el servicio adquirido.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">10. Modificaciones</h2>
              <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el sitio web. El uso continuado del servicio implica aceptación de las actualizaciones.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">11. Cancelación y Terminación</h2>
              <p>Meteora Academy podrá cancelar el acceso de un usuario cuando incumpla estos Términos, vulnere derechos de propiedad intelectual o realice conductas que afecten la comunidad. La terminación no generará obligación de reembolso salvo exigencia legal.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">12. Legislación Aplicable</h2>
              <p>Estos Términos se rigen por la legislación aplicable en el país donde la empresa tenga su sede legal. Cualquier controversia será resuelta en los tribunales competentes correspondientes.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">13. Contacto</h2>
              <p>Para consultas relacionadas con estos Términos, puede comunicarse a través del sitio web: <a href="https://meteora.academy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://meteora.academy/</a></p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;
