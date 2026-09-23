// Small shared pieces for the home sections.
export function Label({ children }) {
  return <span className="k-label">{children}</span>;
}

export function Btn({ href, children, ghost = false }) {
  return (
    <a href={href} className={`k-btn ${ghost ? "k-btn--ghost" : "k-btn--gold"}`}>
      {children} <span className="k-arrow" aria-hidden="true">→</span>
    </a>
  );
}

export function Head({ eyebrow, title, children }) {
  return (
    <div className="k-head k-reveal">
      <Label>{eyebrow}</Label>
      <h2 className="k-h2">{title}</h2>
      {children}
    </div>
  );
}

// bg: optional still behind the section; backdrop: optional node (e.g. a video) behind it
export function Section({ id, className = "", children, label, bg, backdrop }) {
  return (
    <section id={id} aria-label={label} className={`k-section ${bg || backdrop ? "k-section--media" : ""} ${className}`}>
      {bg && <img className="k-section__bg" src={bg} alt="" loading="lazy" aria-hidden="true" />}
      {backdrop}
      <div className="k-wrap k-grid">{children}</div>
    </section>
  );
}

// stagger by line, never by letter
export const delay = (i, step = 90) => ({ "--d": `${i * step}ms` });
