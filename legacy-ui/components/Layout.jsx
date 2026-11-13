import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Command, Search, Settings, X } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import './preferences.css';

const initialNotifications = [
  { id: 1, title: 'Quarterly review due soon', detail: 'Mobile App · Review due in 2 days', time: 'Today', unread: true },
  { id: 2, title: 'New feedback received', detail: 'Beacon Admin · Feedback is ready to review', time: 'Yesterday', unread: true },
  { id: 3, title: 'Project review overdue', detail: 'Website Redesign · Review is 3 days overdue', time: 'Oct 24', unread: true },
];

function initialsFor(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
}

export default function Layout({ children, profile, darkMode }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  useEffect(() => {
    function handlePointerDown(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setNotificationsOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
  }

  function markRead(id) {
    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, unread: false } : notification
    )));
  }

  return (
    <div className={`app-shell${darkMode ? ' dark-theme' : ''}`}>
      <Sidebar profile={profile} />
      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">✦ ProFeed</div>
          <div className="global-search">
            <Search size={17} />
            <input aria-label="Search" placeholder="Search projects, feedback, people..." />
            <kbd><Command size={11} /> K</kbd>
          </div>
          <div className="top-actions">
            <div className="notification-anchor" ref={notificationRef}>
              <button
                type="button"
                className="icon-button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                aria-controls="notification-panel"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <section className="notification-panel" id="notification-panel" aria-label="Notifications">
                  <div className="notification-heading">
                    <div><h2>Notifications</h2><p>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p></div>
                    <button type="button" className="notification-close" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={17} /></button>
                  </div>
                  {notifications.length ? (
                    <div className="notification-list">
                      {notifications.map((notification) => (
                        <article className={`notification-item${notification.unread ? ' unread' : ''}`} key={notification.id}>
                          <span className="notification-indicator" />
                          <div>
                            <strong>{notification.title}</strong>
                            <p>{notification.detail}</p>
                            <small>{notification.time}</small>
                          </div>
                          {notification.unread && <button type="button" className="notification-read" aria-label={`Mark ${notification.title} as read`} onClick={() => markRead(notification.id)}><Check size={15} /></button>}
                        </article>
                      ))}
                    </div>
                  ) : <p className="notification-empty">You have no notifications.</p>}
                  <div className="notification-footer">
                    <span>Illustrative demo notifications</span>
                    <button type="button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>
                  </div>
                  <Link className="notification-settings-link" to="/settings" onClick={() => setNotificationsOpen(false)}><Settings size={14} /> Notification preferences</Link>
                </section>
              )}
            </div>
            <Link to="/settings" className="top-profile" aria-label="Open profile settings">
              {profile?.photoDataUrl
                ? <img className="avatar avatar-photo" src={profile.photoDataUrl} alt="" />
                : <span className="avatar avatar-purple">{initialsFor(profile?.name)}</span>}
              <span className="top-profile-name">{profile?.name || 'User'}</span>
            </Link>
          </div>
        </header>
        <div className="page-content">
          {children}
          <footer className="footer"><span>© 2026 ProFeed</span><span>Built for better collaboration <b>✦</b></span></footer>
        </div>
      </main>
    </div>
  );
}
