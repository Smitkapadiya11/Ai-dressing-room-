import { hero, problem, origin, founder } from "@/content/home";
import { clean } from "@/content/clean";
import { Btn, Head, Label, Section, delay } from "./ui";
import { MEDIA } from "@/lib/media";
import Clip from "./Clip";

export function Nav() {
  return (
    <header className="k-nav">
      <nav className="k-wrap k-nav__in" aria-label="Main">
        <a href="/" className="k-mark">
          Kapadiya <span>&amp;</span> Sons
        </a>
        <div className="k-nav__links">
          <a href="#how">How it works</a>
          <a href="#promise">Our promise</a>
          <a href="#plans">Plans</a>
          <a href="#faq">FAQ</a>
          <Btn href="/mirror">Try it on</Btn>
        </div>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section className={`k-hero ${MEDIA.hero ? "k-hero--video" : ""}`} aria-label="Introduction">
      {MEDIA.hero && (
        <div className="k-hero__bg" aria-hidden="true">
          <Clip src={MEDIA.hero} className={MEDIA.heroPortrait ? "k-only-wide" : ""} concept />
          {MEDIA.heroPortrait && <Clip src={MEDIA.heroPortrait} className="k-only-narrow" concept />}
        </div>
      )}
      <div className="k-wrap k-grid">
        <div className="k-hero__copy">
          <div className="k-reveal">
            <Label>{hero.eyebrow}</Label>
          </div>
          <h1 className="k-h1" style={{ marginTop: 28 }}>
            {hero.title.map((line, i) => (
              <span key={i} className="k-line k-reveal" style={delay(i + 1)}>
                {i === 1 ? <em>{line}</em> : line}
              </span>
            ))}
          </h1>
          <p className="k-lead k-reveal" style={delay(4)}>
            {hero.sub}
          </p>
          <div className="k-hero__ctas k-reveal" style={delay(5)}>
            <Btn href={hero.primary.href}>{hero.primary.label}</Btn>
            <Btn href={hero.secondary.href} ghost>
              {hero.secondary.label}
            </Btn>
          </div>
        </div>
        {!MEDIA.hero && <div className="k-hero__visual k-reveal" style={delay(3)}>
          {/* Code-native stand-in until /media/hero-loop.mp4 exists: the garment drapes down over the capture. */}
          <div className="k-mirror" role="img" aria-label="A customer in the mirror, then the same customer wearing a new outfit">
            <div className="k-mirror__glass">
              <img src="/looks/mirror-feed.jpg" alt="" fetchPriority="high" />
              <img src="/looks/look-crimson.jpg" alt="" className="k-mirror__after" />
              <div className="k-mirror__seam" />
            </div>
            <span className="k-mirror__tag">Before · After</span>
          </div>
        </div>}
      </div>
    </section>
  );
}

export function Problem() {
  return (
    <Section id="problem" label="The problem">
      <Head eyebrow={problem.eyebrow} title={problem.title} />
      <div className="k-rows">
        {problem.items.map((it, i) => (
          <div key={it.k} className={`k-row k-reveal ${MEDIA.problem[i] ? "k-row--img" : ""}`} style={delay(i)}>
            <span className="k-row__k">{it.k}</span>
            {MEDIA.problem[i] && <img className="k-row__img" src={MEDIA.problem[i]} alt="" loading="lazy" />}
            <h3 className="k-h3">{it.title}</h3>
            <p>{it.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Origin() {
  return (
    <Section id="origin" label="Where the idea came from">
      <Head eyebrow={origin.eyebrow} title={origin.title} />
      <ol className="k-timeline" style={{ listStyle: "none", margin: 0 }}>
        {origin.steps.map((s, i) => (
          <li key={i} className="k-tl k-reveal" style={delay(i, 140)}>
            {MEDIA.origin[i] && <img className="k-tl__img" src={MEDIA.origin[i]} alt="" loading="lazy" />}
            <div className="k-tl__when">{clean(s.when)}</div>
            <h3 className="k-h3">{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// The portrait slot shows a monogram until public/media/home/founder.jpg exists.
export function Founder() {
  const portrait = MEDIA.founder;
  return (
    <Section id="founder" label="The founder">
      <div className="k-founder__side k-reveal">
        <div className="k-portrait">
          {portrait ? (
            <img src={portrait} alt={`Portrait of ${founder.name}`} loading="lazy" />
          ) : (
            <span className="k-portrait__ph" aria-hidden="true">
              SK
            </span>
          )}
        </div>
      </div>
      <div className="k-founder__main">
        <div className="k-reveal">
          <Label>{founder.eyebrow}</Label>
        </div>
        <h2 className="k-h2 k-reveal" style={{ marginTop: 22 }}>
          {founder.name}
        </h2>
        <p className="k-lead k-reveal" style={{ marginTop: 24 }}>
          {founder.intro}
        </p>
        <div className="k-thread">
          <span className="k-thread__track" aria-hidden="true" />
          <span className="k-thread__fill" aria-hidden="true" />
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {founder.milestones.map((m, i) => (
              <li key={i} className="k-stitch k-reveal" style={delay(i % 2)}>
                <span className="k-tl__when">{m.when}</span>
                <h3 className="k-h3">{m.title}</h3>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
