import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import meteoraLogo from '@/assets/logo-white-pink.png';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link to="/"><img src={meteoraLogo} alt="Meteora Academy" className="h-6 md:h-8" /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver</Link>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto prose-invert">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8">Última actualización: 16/02/2026</p>

          <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
            <p>La Meteora Academy ("nosotros", "nuestro(a)", "la Empresa") respeta su privacidad y está comprometida con la protección de sus datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos, compartimos y protegemos la información personal de los usuarios que acceden al sitio web https://meteora.academy/ y a nuestros servicios digitales, educativos y de mentoría.</p>
            <p>Al utilizar nuestro sitio web y servicios, usted acepta las prácticas descritas en esta Política.</p>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Información que recopilamos</h2>
              <h3 className="text-base font-display font-semibold text-foreground mb-2">1.1 Información proporcionada directamente por el usuario</h3>
              <p className="mb-2">Cuando usted se registra en nuestros cursos, solicita información, completa formularios, realiza pagos, se suscribe a boletines o participa en mentorías o eventos, podemos recopilar:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre completo</li><li>Dirección de correo electrónico</li><li>Número de teléfono</li><li>Datos de facturación</li><li>Información de pago</li><li>Empresa y cargo (cuando aplique)</li><li>Cualquier otra información que usted proporcione voluntariamente</li>
              </ul>
              <h3 className="text-base font-display font-semibold text-foreground mt-4 mb-2">1.2 Información recopilada automáticamente</h3>
              <p className="mb-2">Cuando navega por nuestro sitio, podemos recopilar: Dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de permanencia, datos de interacción, cookies y tecnologías similares. Esta información se utiliza para mejorar la experiencia del usuario y optimizar nuestros servicios.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">2. Finalidad del tratamiento de datos</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Proporcionar y gestionar nuestros cursos, mentorías y servicios digitales</li><li>Procesar pagos y emitir comprobantes</li><li>Enviar información relevante sobre programas y actualizaciones</li><li>Brindar soporte al cliente</li><li>Mejorar nuestros contenidos y servicios</li><li>Cumplir obligaciones legales y regulatorias</li><li>Realizar análisis estadísticos y estratégicos</li>
              </ul>
              <p className="mt-2">No utilizamos sus datos para fines distintos a los aquí descritos sin su consentimiento previo.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Base legal para el tratamiento</h2>
              <p>El tratamiento de datos personales se realiza conforme a: consentimiento del titular, ejecución de contrato, cumplimiento de obligaciones legales e intereses legítimos de la empresa. En el caso de usuarios ubicados en Brasil, el tratamiento se rige por la LGPD (Ley nº 13.709/2018).</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">4. Compartición de datos con terceros</h2>
              <p>Podemos compartir datos personales únicamente cuando sea necesario con proveedores de servicios tecnológicos, plataformas de pago, servicios de alojamiento web, herramientas de email marketing y autoridades legales cuando sea requerido por ley. Todos los terceros están obligados a mantener la confidencialidad y seguridad de la información. <strong className="text-foreground">No vendemos ni comercializamos datos personales.</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Cookies y tecnologías similares</h2>
              <p>Utilizamos cookies para recordar preferencias del usuario, analizar tráfico y comportamiento, y mejorar la experiencia de navegación. Usted puede configurar su navegador para rechazar cookies; sin embargo, algunas funcionalidades del sitio podrían verse afectadas.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Seguridad de la información</h2>
              <p>Implementamos medidas técnicas y organizativas adecuadas para proteger los datos personales contra acceso no autorizado, alteración, divulgación indebida, pérdida o destrucción. No obstante, ningún sistema es completamente seguro, por lo que no podemos garantizar seguridad absoluta.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">7. Derechos del titular de los datos</h2>
              <p>Usted tiene derecho a acceder a sus datos personales, solicitar corrección de datos inexactos, solicitar eliminación de sus datos, revocar su consentimiento, solicitar portabilidad y oponerse al tratamiento. Para ejercer estos derechos, puede contactarnos a través de los canales indicados en el sitio web.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">8. Conservación de datos</h2>
              <p>Los datos personales serán almacenados únicamente durante el tiempo necesario para cumplir con las finalidades descritas en esta Política o según lo exija la legislación aplicable.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">9. Enlaces a sitios de terceros</h2>
              <p>Nuestro sitio puede contener enlaces a páginas externas. No somos responsables por las prácticas de privacidad de dichos sitios.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">10. Cambios en esta Política</h2>
              <p>Nos reservamos el derecho de actualizar esta Política en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en el sitio web.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">11. Información de contacto</h2>
              <p>Si tiene preguntas sobre esta Política de Privacidad o sobre el tratamiento de sus datos, puede comunicarse con nosotros a través de: <a href="https://meteora.academy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://meteora.academy/</a></p>
            </section>

            {/* Consideraciones Importantes */}
            <hr className="border-border my-10" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Consideraciones Importantes</h2>
            <p>La Meteora Academy tiene como misión acelerar el crecimiento profesional, empresarial y personal de sus alumnos a través de programas educativos, mentorías, herramientas digitales y acompañamiento estratégico. Antes de adquirir cualquiera de nuestros productos o servicios, le pedimos que lea atentamente las siguientes consideraciones:</p>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">1. Naturaleza Educativa de los Servicios</h3>
              <p>Todos los contenidos ofrecidos tienen carácter educativo y formativo. No constituyen asesoría legal, contable, financiera personalizada ni garantía de resultados específicos. Las decisiones tomadas a partir del contenido proporcionado son responsabilidad exclusiva del alumno.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">2. Responsabilidad sobre Resultados</h3>
              <p>Los resultados dependen de múltiples factores: nivel de compromiso, aplicación práctica, experiencia previa, contexto económico y capacidad de ejecución. No garantizamos ingresos, crecimiento empresarial ni resultados específicos.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">3. Compromiso del Alumno</h3>
              <p>Al inscribirse, el alumno acepta que es responsable de su implementación práctica, debe cumplir con las actividades propuestas, participará activamente en sesiones y mantendrá una conducta ética y respetuosa.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">4. Propiedad Intelectual</h3>
              <p>Todo el contenido es propiedad exclusiva de Meteora Academy y está protegido por las leyes de propiedad intelectual. Queda estrictamente prohibido reproducir, distribuir, compartir, revender, copiar o modificar cualquier contenido sin autorización expresa y por escrito.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">5. Uso Adecuado de Plataformas</h3>
              <p>El acceso a nuestras plataformas digitales es personal e intransferible. El uso indebido podrá resultar en suspensión inmediata sin derecho a reembolso.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">6. Pagos y Reembolsos</h3>
              <p>Las condiciones de pago, plazos y políticas de reembolso se informan claramente en el momento de la contratación.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">7. Disponibilidad del Servicio</h3>
              <p>Pueden ocurrir interrupciones temporales por mantenimiento técnico, actualizaciones del sistema o fallos externos fuera de nuestro control.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">8. Actualizaciones y Cambios</h3>
              <p>Meteora Academy puede actualizar contenidos, estructura de programas, metodologías y plataformas con el objetivo de mejorar la experiencia y resultados de los alumnos.</p>
            </section>

            <section>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">9. Aceptación</h3>
              <p>Al utilizar nuestros servicios, el usuario declara haber leído, comprendido y aceptado estas Consideraciones Importantes.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
