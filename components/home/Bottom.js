import { steps, features, honesty, system, reasons, faq, closing, contact } from "@/content/home";
import { pricing, SHOW_PRICING } from "@/content/pricing";
import { clean } from "@/content/clean";
import { Btn, Head, Label, Section, delay } from "./ui";
import ContactForm from "./ContactForm";
import { MEDIA } from "@/lib/media";
import Clip from "./Clip";
import Icon from "./Icon";

const FEATURE_ICONS = ["hanger", "spark", "qr", "mirror", "play"];
const REASON_ICONS = ["eye", "clock", "heart", "crown", "wallet", "phone"];

export function Steps() {
  const { coda, head } = steps;
  return (
    <Section id="how" label="How it works" className="k-how">
      <div className="k-how__head">
        <Head eyebrow={steps.eyebrow} title={steps.title} />
        <figure className="k-how__polaroid k-reveal" style={delay(2)}>
          <img src={head.img} alt={head.alt} loading="lazy" />
        </figure>
      </div>
      <ol className="k-how__list">
        {steps.items.map((s, i) => (
          <li key={s.n} className={`k-how__step k-how__step--${i + 1}`}>
            <div className="k-how__vis k-reveal">
              <div className="k-how__frame">
                <img src={s.img} alt={s.alt} loading="lazy" />
              </div>
              <span className="k-how__tag">{s.tag}</span>
              {s.loupe && (
                <span className="k-how__loupe">
                  <img src={s.loupe} alt="" loading="lazy" />
                  <em>Every zari thread, kept</em>
                </span>
              )}
            </div>
            <div className="k-how__copy k-reveal" style={delay(1, 140)}>
              <span className="k-how__n" aria-hidden="true">{s.n}</span>
              <h3 className="k-h2">{s.title}</h3>
              <p className="k-lead">{s.body}</p>
              {s.honest && <a href="#promise" className="k-step__flag">Only the clothes change →</a>}
            </div>
          </li>
        ))}
      </ol>
      <div className="k-how__coda k-reveal">
        <img src={coda.img} alt={coda.alt} loading="lazy" />
        <div className="k-how__codacopy">
          <Label>{coda.eyebrow}</Label>
          <h3 className="k-h2">{coda.title}</h3>
          <p>{coda.body}</p>
        </div>
      </div>
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
            {MEDIA.features[i] && <img className="k-feat__img" src={MEDIA.features[i]} alt="" loading="lazy" />}
            <span className="dr-ico"><Icon name={FEATURE_ICONS[i] || "spark"} /></span>
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
    <Section id="promise" label="Our promise" className="k-honest" bg={MEDIA.honesty.bg}>
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
          {MEDIA.honesty.before && MEDIA.honesty.after ? (
            <>
              <img className="k-pair__slot" src={MEDIA.honesty.before} alt="Original photo, taken on the mirror" loading="lazy" />
              <img className="k-pair__slot" src={MEDIA.honesty.after} alt="The same person after try-on, only the clothes changed" loading="lazy" />
            </>
          ) : (
            <>
              <div className="k-pair__slot">Original photo</div>
              <div className="k-pair__slot">Try-on result</div>
            </>
          )}
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
        {MEDIA.product && <img className="k-sys__product" src={MEDIA.product} alt="The Kapadiya & Sons mirror kiosk" loading="lazy" />}
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
    <Section id="why" label="Why shops buy it" bg={MEDIA.benefits} className={MEDIA.benefits ? "k-band" : ""}>
      <Head eyebrow={reasons.eyebrow} title={reasons.title} />
      <div className="k-reasons">
        {reasons.items.map((r, i) => (
          <div key={r.title} className="k-reason k-reveal" style={delay(i % 3)}>
            <span className="dr-ico"><Icon name={REASON_ICONS[i] || "spark"} /></span>
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
            <summary>
              {f.q}
              <Icon name="plus" size={18} className="dr-faq-plus" />
            </summary>
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
      <Section id="contact" label="Book a demo" className={`k-close ${MEDIA.ctaSilk ? "k-close--video" : ""}`} backdrop={MEDIA.ctaSilk && <Clip src={MEDIA.ctaSilk} className="k-section__bgclip" />}>
        <h2 className="k-h1">
          {closing.title.map((l, i) => (
            <span key={i} className="k-line k-reveal" style={delay(i)}>
              {i === 1 ? <em>{l}</em> : l}
            </span>
          ))}
        </h2>
        <p className="k-lead k-reveal" style={{ ...delay(2), gridColumn: "1 / span 7", marginTop: 28 }}>
          {closing.formIntro}
        </p>
        <div className="k-close__form k-reveal" style={delay(3)}>
          <ContactForm whatsapp={contact.whatsapp} />
        </div>
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
                  <a href={wa}>WhatsApp {contact.phoneDisplay}</a>
                </p>
              )}
              {contact.phoneDisplay && (
                <p style={{ margin: "0 0 8px" }}>
                  <a href={`tel:+${contact.whatsapp}`}>Call {contact.phoneDisplay}</a>
                </p>
              )}
              {contact.email && (
                <p style={{ margin: 0 }}>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              )}
            </div>
            <p style={{ margin: 0 }}>
              Privacy: the camera photo is used only to make the try-on and is not saved. The finished look is stored so the QR works, and its link stops working after 15 minutes.
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
