// Three-bar pulse (after aryamitra06 on Uiverse.io). Pure CSS in globals.css;
// `size="sm"` fits inside an action button.
export default function BarLoader({ size = "md", className = "" }) {
  return (
    <span className={`bar-loader ${size === "sm" ? "bar-loader-sm" : ""} ${className}`} role="status" aria-label="Loading">
      <span className="bar-loader-bar" />
      <span className="bar-loader-bar" />
      <span className="bar-loader-bar" />
    </span>
  );
}
