import { steps, features, honesty, system, reasons, faq, closing, contact } from "@/content/home";
import { pricing, SHOW_PRICING } from "@/content/pricing";
import { clean } from "@/content/clean";
import { Btn, Head, Label, Section, delay } from "./ui";

// Code-native loops for the three steps, until step-*.mp4 exist.
const STEP_VISUALS = [
  <>
    <div className="v-figure" />
    <div className="v-scan" />
  </>,
  <div className="v-rail">
    <span />
    <span />
    <span />
    <span />
  </div>,
  <>
    <div className="v-figure" />
    <div className="v-drape" />
  </>,
];

export function Steps() {
  return (
    <Section id="how" label="How it works">
      <Head eyebrow={steps.eyebrow} title={steps.title} />
      <ol className="k-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {steps.items.map((s, i) => (
          <li key={s.n} className={`k-step k-reveal ${s.honest ? "k-step--honest" : ""}`} style={delay(i, 140)}>
            <div className="k-step__vis" aria-hidden="true">
              {STEP_VISUALS[i]}
            </div>
            <span className="k-step__n">{s.n}</span>
            <h3 className="k-h3">{s.title}</h3>
            <p>{s.body}</p>
            {s.honest && <a href="#promise" className="k-step__flag">Only the clothes change →</a>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Features() {
  return (
    <Section id="features" label="Features">
      <Head eyebrow={features.eyebrow} title={features.title} />
      <div className="k-feat">
        {features.live.map((f, i) => (
          <div key={f.title} className="k-feat__item k-reveal" style={delay(i % 2)}>
            <h3 className="k-h3">{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
      <aside className="k-soon k-reveal" style={delay(2)}>
        <Label>Coming soon</Label>
        <ul>
          {features.soon.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </aside>
    </Section>
  );
}

// Slots stay as labelled placeholders until consented demo photos from the real app exist.
export function Honesty() {
  return (
    <Section id="promise" label="Our promise" className="k-honest">
      <div className="k-honest__copy">
        <div className="k-reveal">
          <Label>{honesty.eyebrow}</Label>
        </div>
        <h2 className="k-h1">
          {honesty.title.map((l, i) => (
            <span key={i} className="k-line k-reveal" style={delay(i + 1)}>
              {i === 1 ? <em>{l}</em> : l}
            </span>
          ))}
        </h2>
        <ul>
          {honesty.points.map((p, i) => (
            <li key={i} className="k-reveal" style={delay(i + 2)}>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <figure className="k-honest__vis k-reveal" style={{ ...delay(2), margin: 0 }}>
        <div className="k-pair">
          <div className="k-pair__slot">Original photo</div>
          <div className="k-pair__slot">Try-on result</div>
        </div>
        <figcaption className="k-pair__cap">{honesty.caption}</figcaption>
      </figure>
    </Section>
  );
}

export function System() {
  const xs = [40, 213, 386, 560];
  return (
    <Section id="system" label="How the system fits together">
      <div className="k-sys__copy k-reveal">
        <Label>{system.eyebrow}</Label>
        <h2 className="k-h2">{system.title}</h2>
        <p className="k-lead">{system.body}</p>
      </div>
      <div className="k-sys__dia" data-reveal>
        <svg viewBox="0 0 600 140" role="img" aria-label={system.nodes.join(" → ")}>
          <path d="M 40 60 H 560" pathLength="1" className="k-sys__path" stroke="#C9A961" strokeWidth="1.2" fill="none" />
          <circle r="4" fill="#E3CFA0" className="k-sys__pulse" />
          {system.nodes.map((n, i) => (
            <g key={n} transform={`translate(${xs[i]} 60)`}>
              <circle r="9" fill="#0C0B0A" stroke="#C9A961" strokeWidth="1.5" />
              <circle r="3" fill="#C9A961" />
              <text y={i % 2 ? -26 : 38} textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"} fill="#F1ECE2" fontSize="14" fontFamily="Manrope, sans-serif">
                {n}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Section>
  );
}

export function Reasons() {
  return (
    <Section id="why" label="Why shops buy it">
      <Head eyebrow={reasons.eyebrow} title={reasons.title} />
      <div className="k-reasons">
        {reasons.items.map((r, i) => (
          <div key={r.title} className="k-reason k-reveal" style={delay(i % 3)}>
            <h3 className="k-h3">{r.title}</h3>
            <p>{r.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Plans() {
  if (!SHOW_PRICING) return null;
  const note = clean(pricing.note);
  return (
    <Section id="plans" label="Plans">
      <Head eyebrow={pricing.eyebrow} title={pricing.title} />
      <div className="k-tiers">
        {pricing.tiers.map((t, i) => (
          <article key={t.name} className={`k-tier k-reveal ${t.featured ? "k-tier--featured" : ""}`} style={delay(i, 120)}>
            <span className="k-label">{t.name}</span>
            <div className="k-tier__price">
              {t.price}
              <small>{t.period}</small>
            </div>
            {t.lead && <p className="k-muted" style={{ margin: 0 }}>{t.lead}</p>}
            {t.features.length > 0 && (
              <ul>
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            <Btn href={pricing.cta.href} ghost={!t.featured}>
              {pricing.cta.label}
            </Btn>
          </article>
        ))}
      </div>
      {note && <p className="k-note">{note}</p>}
    </Section>
  );
}

export function Faq() {
  const items = faq.items.map((f) => ({ ...f, a: clean(f.a) })).filter((f) => f.a);
  return (
    <Section id="faq" label="Frequently asked questions">
      <div className="k-faq__head k-reveal">
        <Label>{faq.eyebrow}</Label>
      </div>
      <div className="k-faq">
        {items.map((f) => (
          <details key={f.q} className="k-reveal">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function Closing() {
  const wa = contact.whatsapp && `https://wa.me/${contact.whatsapp}`;
  return (
    <>
      <Section id="contact" label="Book a demo" className="k-close">
        <h2 className="k-h1">
          {closing.title.map((l, i) => (
            <span key={i} className="k-line k-reveal" style={delay(i)}>
              {i === 1 ? <em>{l}</em> : l}
            </span>
          ))}
        </h2>
        <div className="k-close__row k-reveal" style={delay(2)}>
          {wa && <Btn href={wa}>Book a demo on WhatsApp</Btn>}
          {contact.email && (
            <Btn href={`mailto:${contact.email}?subject=Demo%20in%20my%20shop`} ghost={!!wa}>
              Email us
            </Btn>
          )}
          <Btn href="/mirror" ghost={!!(wa || contact.email)}>
            Try it on yourself
          </Btn>
        </div>
      </Section>
      <footer className="k-foot">
        <div className="k-wrap">
          <div className="k-foot__grid">
            <div>
              <p className="k-foot__sign">{closing.signoff}</p>
              <p style={{ margin: 0 }}>Kapadiya &amp; Sons · {contact.city}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 8px" }}>
                <a href="/mirror">The mirror</a>
              </p>
              {wa && (
                <p style={{ margin: "0 0 8px" }}>
                  <a href={wa}>WhatsApp</a>
                </p>
              )}
              {contact.email && (
                <p style={{ margin: 0 }}>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              )}
            </div>
            <p style={{ margin: 0 }}>
              Privacy: the camera photo is used only to make the try-on and is not saved. The finished look is held for 15 minutes so it can be scanned to a phone.
            </p>
          </div>
          <div className="k-foot__base">
            <span>© {new Date().getFullYear()} Kapadiya &amp; Sons</span>
            <span>{closing.credit}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
