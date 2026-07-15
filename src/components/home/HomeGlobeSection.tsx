import { HomeGlobeScene } from './HomeGlobeScene'

const branches = [
  {
    address: 'A2, Plot No. 10576015-3, Sajja Industrial Area, Sharjah, UAE',
    name: 'Sharjah Branch',
    phone: '+971 509 469 979',
    phoneHref: 'tel:+971509469979',
  },
  {
    address: 'Plot No. D-81, Thoban Industrial Area, Fujairah, UAE',
    name: 'Thoban Branch',
    phone: '+971 505 389 979',
    phoneHref: 'tel:+971505389979',
  },
]

const deliveryLabels = ['Europe', 'UAE', 'Saudi', 'Africa']
const clients = ['Uber', 'Rappi', 'GE', 'Glovo', 'Telenor', 'FairMoney', 'Vinted']

export function HomeGlobeSection() {
  return (
    <section
      aria-labelledby="global-delivery-title"
      className="global-delivery"
      data-nav-surface="white"
      data-scroll-snap="section"
      id="global-delivery"
    >
      <div className="global-delivery-main flex flex-row">
        <div className="global-delivery-copy">
          <h2 id="global-delivery-title">
            <span>We deliver all over</span>
            <strong>Middle-East, Europe</strong>
            <span className="global-delivery-africa">
              <i>&amp;</i> <strong>Africa</strong>
            </span>
          </h2>

          <div className="globe-branches">
            {branches.map((branch) => (
              <article className="globe-branch-card" key={branch.name}>
                <h3>{branch.name}</h3>
                <p>{branch.address}</p>
                <a href={branch.phoneHref}>{branch.phone}</a>
              </article>
            ))}
          </div>

          <div className="our-clients-title">
            <p>Our Clients From All Around The World</p>
          </div>
        </div>

        <div
          aria-label="Sky Wings delivery regions from the UAE"
          className="globe-stage"
          data-testid="globe-stage"
        >
          <HomeGlobeScene />
          <div className="globe-label-layer" aria-hidden="true">
            {deliveryLabels.map((label) => (
              <span
                className={`globe-location-label globe-location-${label.toLowerCase()}`}
                data-globe-label={label}
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="globe-clients">
        <div className="globe-client-viewport">
          <div className="globe-client-rail">
            {[0, 1].map((trackIndex) => (
              <div
                aria-hidden={trackIndex === 1 ? 'true' : undefined}
                className="globe-client-track"
                key={trackIndex}
              >
                {clients.map((client) => (
                  <span
                    className={`globe-client-logo globe-client-${client.toLowerCase()}`}
                    key={`${trackIndex}-${client}`}
                  >
                    {client}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
