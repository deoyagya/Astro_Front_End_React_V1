/**
 * ChartVisualAid — Collapsible image/video panel from admin-configured step content.
 */
import { useState } from 'react';

export default function ChartVisualAid({ content }) {
  const [open, setOpen] = useState(false);

  if (!content) return null;
  const hasMedia = content.image_url || content.video_url;
  const hasText = content.help_text || content.tooltip;
  if (!hasMedia && !hasText) return null;

  return (
    <div className="wiz-visual-aid">
      <button className="wiz-visual-aid-toggle" onClick={() => setOpen(!open)}>
        <i className={`fas fa-${open ? 'chevron-up' : 'lightbulb'}`}></i>
        {open ? 'Hide help' : 'Need help with this step?'}
      </button>
      {open && (
        <div className="wiz-visual-aid-body">
          {content.help_text && <p style={{ color: '#c7cfdd', fontSize: '0.88rem', marginBottom: '0.75rem' }}>{content.help_text}</p>}
          {content.image_url && <img src={content.image_url} alt="Visual guide" loading="lazy" />}
          {content.video_url && (
            <iframe
              src={content.video_url}
              title="Video guide"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      )}
    </div>
  );
}
