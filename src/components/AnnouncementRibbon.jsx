import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import '../styles/announcement-ribbon.css';

function dismissedKey(id) {
  return `announcement-dismissed:${id}`;
}

export default function AnnouncementRibbon() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const pathname = useMemo(() => location.pathname || '/', [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const data = await api.get(`/v1/announcements/current?page_path=${encodeURIComponent(pathname)}`);
        if (cancelled) return;
        setAnnouncement(data?.announcement || null);
      } catch {
        if (cancelled) return;
        setAnnouncement(null);
      }
    }

    setDismissed(false);
    loadAnnouncement();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!announcement?.id) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(sessionStorage.getItem(dismissedKey(announcement.id)) === '1');
    } catch {
      setDismissed(false);
    }
  }, [announcement?.id]);

  const handleClose = () => {
    if (!announcement?.id) return;
    try {
      sessionStorage.setItem(dismissedKey(announcement.id), '1');
    } catch {
      // ignore storage failures and still close locally
    }
    setDismissed(true);
  };

  if (!announcement || dismissed) return null;

  return (
    <div className="announcement-ribbon" role="status" aria-live="polite">
      <div className="announcement-ribbon-inner">
        <div className="announcement-ribbon-message">
          <i className="fas fa-bullhorn" aria-hidden="true"></i>
          <span>{announcement.message}</span>
        </div>
        <button
          type="button"
          className="announcement-ribbon-close"
          aria-label="Dismiss announcement"
          onClick={handleClose}
        >
          <i className="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
