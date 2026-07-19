import Reveal from '../components/Reveal'

function FeatureCard({ img, title, desc, delay }) {
  return (
    <Reveal className="flex-1" delay={delay}>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white">
        <div className="h-[300px] overflow-hidden border-b border-line bg-[#f7f8fc] lg:h-[500px] lg:bg-white">
          <img src={img} alt={title} className="h-full w-full rounded-t-[15px] object-cover object-top" />
        </div>
        <div className="flex flex-col gap-2 p-6 lg:p-5">
          <h3 className="font-display text-[20px] font-bold text-ink">{title}</h3>
          <p className="font-body text-[14px] leading-[1.55] text-muted">{desc}</p>
        </div>
      </div>
    </Reveal>
  )
}

export default function Features() {
  return (
    <section id="features" className="bg-bgalt">
      <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-16 lg:py-[88px]">
        <Reveal className="flex flex-col items-center text-center">
          <span className="inline-block rounded-full bg-white px-4 py-2 font-body text-[13px] font-semibold text-indigo">
            Nos fonctionnalités
          </span>
          <h2 className="mt-4 max-w-[760px] font-display text-[28px] font-semibold leading-[1.1] text-ink lg:text-[44px]">
            Une banque conçue pour vous.
          </h2>
        </Reveal>

        <div className="mt-8 flex flex-col gap-5 lg:mt-11 lg:gap-6">
          {/* Row 1 */}
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
            <FeatureCard
              img="/img/feat-visa.png"
              title="Visa étudiant"
              desc="Compte bloqué en 24h depuis l’Afrique. Attestation officielle. Vous n’avez pas le montant complet ? Krisma Visa Flex complète le reste."
            />
            <FeatureCard
              img="/img/feat-compte.png"
              title="Compte bancaire européen"
              desc="IBAN européen, carte Mastercard / Visa virtuelle et physique. Ouvrez votre compte depuis l’Afrique avant votre départ"
              delay={0.05}
            />
          </div>

          {/* Risk / wide card */}
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="h-[300px] overflow-hidden border-b border-line bg-[#f7f8fc] lg:h-[460px] lg:bg-white">
                {/* Mobile: single "Envoyer" app screen (matches the mobile design) */}
                <img
                  src="/img/feat-transferts-mobile.png"
                  alt="Transferts entre l'Afrique et l'Europe"
                  className="h-full w-[90%] mx-auto object-cover object-top lg:hidden"
                />
                {/* Desktop: wide 2-panel illustration */}
                <img
                  src="/img/feat-transferts.png"
                  alt="Transferts entre l'Afrique et l'Europe"
                  className="hidden h-full w-full rounded-t-[15px] object-cover object-top lg:block"
                />
              </div>
              <div className="flex flex-col gap-2 p-6 lg:items-center lg:py-7 lg:text-center">
                <h3 className="font-display text-[20px] font-bold text-ink">Transferts entre l'Afrique et l'Europe</h3>
                <p className="max-w-[580px] font-body text-[14px] leading-[1.55] text-muted">
                  Envoyez et recevez de l’argent dans les deux sens, instantanément et aux meilleurs taux
                </p>
              </div>
            </div>
          </Reveal>

          {/* Row 2 */}
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
            <FeatureCard
              img="/img/feat-garantie.png"
              title="Garantie locative"
              desc="Trouvez votre logement en France sans garant sur place."
            />
            <FeatureCard
              img="/img/feat-assistant.png"
              title="Assistant personnel IA multilingue"
              desc="Disponible 24h/24"
              delay={0.05}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
