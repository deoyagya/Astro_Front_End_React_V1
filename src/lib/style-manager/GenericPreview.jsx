/**
 * GenericPreview — Renders live element previews for any screen.
 *
 * Reads the selected screen's registry definition and renders each element
 * as a styled span, grouped by category. Works for any screen — no
 * hardcoded layout.
 *
 * @module lib/style-manager/GenericPreview
 */

export function GenericPreview({ screen, styles }) {
  if (!screen) return null;

  const s = (key) => styles[key] || {};

  return (
    <div className="sm-preview-panel">
      <h3 className="sm-preview-title">Live Preview</h3>

      {screen.categories.map((cat) => (
        <div key={cat.name} style={{ marginBottom: 16 }}>
          <div style={{ color: '#9b95aa', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            {cat.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cat.elements.map((el) => (
              <span
                key={el.key}
                style={{
                  ...s(el.key),
                  display: 'inline-block',
                  textTransform: 'capitalize',
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                }}
              >
                {el.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
