import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import meteoraLogo from '@/assets/logo-white-pink.png';

const CookiesPolicy: React.FC = () => {
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Política de Cookies</h1>
          <p className="text-muted-foreground mb-8">Última actualización: 16/02/2026</p>

          <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
            <p>La presente Política de Cookies explica cómo Meteora Academy utiliza cookies y tecnologías similares en el sitio web <a href="https://meteora.academy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://meteora.academy/</a>. Al continuar navegando en nuestro sitio, usted acepta el uso de cookies conforme a lo establecido en esta Política.</p>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">1. ¿Qué son las cookies?</h2>
              <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Sirven para recordar sus preferencias, mejorar la experiencia de navegación, analizar el comportamiento del usuario y optimizar el rendimiento del sitio. Las cookies no dañan su dispositivo.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">2. ¿Qué tipos de cookies utilizamos?</h2>
              <h3 className="text-base font-display font-semibold text-foreground mb-2">2.1 Cookies estrictamente necesarias</h3>
              <p className="mb-3">Son esenciales para el funcionamiento del sitio: acceso a áreas seguras, gestión de sesiones y procesamiento de formularios.</p>
              <h3 className="text-base font-display font-semibold text-foreground mb-2">2.2 Cookies de rendimiento y análisis</h3>
              <p className="mb-3">Nos permiten analizar el tráfico del sitio, medir visitas y comportamiento, e identificar mejoras técnicas. Recopilan información de forma agregada y anónima.</p>
              <h3 className="text-base font-display font-semibold text-foreground mb-2">2.3 Cookies de funcionalidad</h3>
              <p className="mb-3">Permiten recordar preferencias de idioma, configuraciones personalizadas y datos previamente ingresados.</p>
              <h3 className="text-base font-display font-semibold text-foreground mb-2">2.4 Cookies de marketing y publicidad</h3>
              <p>Pueden utilizarse para mostrar contenido relevante, medir la efectividad de campañas y realizar seguimiento de conversiones. Estas cookies pueden ser gestionadas por terceros.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Cookies de terceros</h2>
              <p>Podemos utilizar servicios de terceros que también instalan cookies, tales como plataformas de análisis web, herramientas de automatización de marketing, procesadores de pago y redes sociales. El tratamiento de datos realizado por dichos terceros se rige por sus propias políticas de privacidad.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">4. ¿Cómo puede gestionar las cookies?</h2>
              <p>Usted puede configurar su navegador para bloquear o eliminar cookies, aceptar o rechazar determinadas categorías, y borrar cookies almacenadas en cualquier momento. Tenga en cuenta que al desactivar ciertas cookies, algunas funcionalidades del sitio podrían verse afectadas.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Base legal para el uso de cookies</h2>
              <p>El uso de cookies se fundamenta en consentimiento del usuario e interés legítimo para el funcionamiento técnico del sitio. Cuando la legislación lo requiera, solicitaremos su consentimiento explícito antes de instalar cookies no esenciales.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Conservación de la información</h2>
              <p>Las cookies pueden ser de sesión (se eliminan al cerrar el navegador) o persistentes (permanecen por un periodo determinado). El tiempo de conservación depende del tipo de cookie utilizada.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">7. Modificaciones a esta Política</h2>
              <p>Meteora Academy puede actualizar esta Política de Cookies en cualquier momento para adaptarla a cambios técnicos o legales. Las actualizaciones entrarán en vigor desde su publicación en el sitio web.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">8. Contacto</h2>
              <p>Si tiene preguntas sobre esta Política de Cookies, puede contactarnos a través de: <a href="https://meteora.academy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://meteora.academy/</a></p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookiesPolicy;
