// src/components/Header.js
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import styles from './Header.module.css';
import logo from '../pages/logo.png';
import useNotifications from '../hooks/useNotifications';
import notificationIcon from '../icon/bell.png';
import NotificationsDropdown from './NotificationsDropdown';

function Header() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useLocalStorage('loggedInUser', null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser'); // Ensure actual localStorage is cleared
    navigate('/home');
  };

  const renderNavLinks = () => {
    let linksToRender = [];
    if (!loggedInUser) {
      // Public / Not Logged In Links - Simplified
      linksToRender = [
        
        { to: "/home", text: "Home" },
        { to: "/news", text: "News" },
        { to: "/#contact", text: "Contact" },
        { to: "/login", text: "Login" },
      ];
    } else if (loggedInUser.type === 'admin') {
      // Admin Links - Minimalist
      linksToRender = [
        { to: "/dashboard", text: "Dashboard" },
        { to: "/news", text: "News" },
        { to: "/#contact", text: "Contact" },
      ];
    } else if (loggedInUser.type === 'student') {
      // Student Links - Minimalist (Dashboard and Profile are key)
      linksToRender = [
        { to: "/student-dashboard", text: "Dashboard" },
        { to: "/student-profile", text: "Profile" },
        { to: "/news", text: "News" },
        { to: "/#contact", text: "Contact" },
      ];
    } else if (loggedInUser.type === 'staff') {
      // Staff Links - Minimalist (Dashboard and Profile are key)
      linksToRender = [
        { to: "/staff-dashboard", text: "Dashboard" },
        { to: "/staff-profile", text: "Profile" },
        { to: "/news", text: "News" },
        { to: "/#contact", text: "Contact" },
      ];
    }

    return (
      <>
        {linksToRender.map(link => (
          <li key={link.to}>
            <NavLink to={link.to} className={({ isActive }) => isActive ? styles.activeLink : undefined}>
              {link.text}
            </NavLink>
          </li>
        ))}
      </>
    );
  };

  return (
    <header className={styles.header}>
      {/* Top bar for user info/logout when logged in */}
      {loggedInUser && (
        <div className={styles.topBar}>
          <span className={styles.welcomeText}>
            Welcome, {loggedInUser.type === 'admin' ? loggedInUser.username : loggedInUser.firstname}!
          </span>
          {/* NEW JSX for notification icon and counter */}
          <div className={styles.notificationContainer} onClick={() => setShowDropdown(!showDropdown)}>
            <img src={notificationIcon} alt="Notifications" className={styles.notificationIcon} />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          {/* NEW CONDITIONAL RENDERING for the dropdown */}
          {showDropdown && <NotificationsDropdown onClose={() => setShowDropdown(false)} />}
        </div>
      )}
      {/* Main Logo and Slogan Area */}
      <div className={styles.mainHeaderContent}>
        <img src={logo} alt="Busarialao College Logo" className={styles.headerLogo} />
      </div>
      {/* Main Navigation - always present, content changes based on login */}
      <nav className={styles.mainNav}>
        <ul className={styles['nav-links']}>
          {renderNavLinks()}
        </ul>
      </nav>
    </header>
  );
}

export default Header;