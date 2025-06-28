import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import menuData from '../data/menuData.json';

const Sidebar = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  // Filter menu sections and items based on user role
  const getFilteredMenuData = () => {
    // If user is not authenticated or no user data, show minimal menu
    if (!isAuthenticated || !user || !user.role) {
      return [
        {
          header: '',
          items: [
            {
              text: 'Dashboard',
              icon: 'bx bx-home-circle',
              available: true,
              link: '/',
              roles: ['super_admin', 'teacher', 'student'],
            },
          ],
        },
      ];
    }

    const filtered = menuData
      .map(section => {
        // Create a deep copy of the section to avoid mutating original data
        const sectionCopy = { ...section };

        // If section has roles defined, check if user has access
        if (section.roles && !section.roles.includes(user.role)) {
          return null;
        }

        // Filter items within the section
        const filteredItems = section.items
          .map(item => {
            // Create a deep copy of the item
            const itemCopy = { ...item };

            // If item has roles defined, check if user has access
            if (item.roles && !item.roles.includes(user.role)) {
              return null;
            }

            // If item has submenu, filter submenu items
            if (item.submenu) {
              const filteredSubmenu = item.submenu.filter(subitem => {
                return !subitem.roles || subitem.roles.includes(user.role);
              });

              // Only show item if it has accessible submenu items
              if (filteredSubmenu.length === 0) {
                return null;
              }

              itemCopy.submenu = filteredSubmenu;
            }

            return itemCopy;
          })
          .filter(item => item !== null);

        // Update section items with filtered items
        sectionCopy.items = filteredItems;

        // Only show section if it has accessible items
        if (filteredItems.length > 0) {
          return sectionCopy;
        } else {
          return null;
        }
      })
      .filter(section => section !== null);

    return filtered;
  };

  const filteredMenuData = getFilteredMenuData();

  // Function to get translated section headers
  const getTranslatedHeader = header => {
    const translations = {
      ADMINISTRATION: t('navigation.administration'),
      TEACHING: t('navigation.teaching'),
      'STUDENT LIFE': t('navigation.studentLife'),
      ACCOUNT: t('navigation.account'),
      Admin: t('navigation.admin'),
      Student: t('navigation.student'),
      Teacher: t('navigation.teacher'),
      Analytics: t('navigation.analytics'),
    };
    return translations[header] || header;
  };

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo px-3">
        <Link
          aria-label="Navigate to sneat homepage"
          to="/"
          className="app-brand-link"
        >
          <span className="app-brand-text demo menu-text fw-bold ms-2">
            {t('program.internshipProgram')}
          </span>
        </Link>

        <a
          href="#"
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {filteredMenuData.map((section, index) => (
          <React.Fragment key={section.header || index}>
            {section.header && (
              <li className="menu-header small text-uppercase">
                <span className="menu-header-text">
                  {getTranslatedHeader(section.header)}
                </span>
              </li>
            )}
            {section.items.map((item, itemIndex) => (
              <MenuItem key={item.link || `item-${itemIndex}`} item={item} />
            ))}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
};

const MenuItem = ({ item }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const isActive = location.pathname === item.link;
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isSubmenuActive =
    hasSubmenu &&
    item.submenu.some(subitem => location.pathname === subitem.link);

  // Function to get translated text for menu items
  const getTranslatedText = text => {
    const translations = {
      Dashboard: t('navigation.dashboard'),
      Users: t('navigation.users'),
      Groups: t('navigation.groups'),
      Programs: t('navigation.programs'),
      Reports: t('navigation.reports'),
      Notifications: t('navigation.notifications'),
      'My Diary': t('navigation.myDiary'),
      'Diary Entry': t('navigation.diaryEntry'),
      Students: t('navigation.students'),
      'Student Diary': t('navigation.studentDiary'),
      'Review Entry': t('navigation.reviewEntry'),
      Admin: t('navigation.admin'),
      Student: t('navigation.student'),
      Teacher: t('navigation.teacher'),
      Analytics: t('navigation.analytics'),
      'Notification Center': t('navigation.notificationCenter'),
      'User Management': t('navigation.userManagement'),
      'All Users': t('navigation.allUsers'),
      'My Students': t('navigation.myStudents'),
      'Student Diaries': t('navigation.studentDiaries'),
      'Add Entry': t('navigation.addEntry'),
      Profile: t('navigation.profile'),
    };
    return translations[text] || text;
  };

  return (
    <li
      className={`menu-item ${isActive || isSubmenuActive ? 'active' : ''} ${hasSubmenu && isSubmenuActive ? 'open' : ''}`}
    >
      <NavLink
        aria-label={`Navigate to ${item.text} ${!item.available ? 'Pro' : ''}`}
        to={item.link}
        className={`menu-link ${item.submenu ? 'menu-toggle' : ''}`}
        target={item.link.includes('http') ? '_blank' : undefined}
      >
        <i className={`menu-icon tf-icons ${item.icon}`}></i>
        <div>{getTranslatedText(item.text)}</div>{' '}
        {item.available === false && (
          <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">
            Pro
          </div>
        )}
      </NavLink>
      {item.submenu && (
        <ul className="menu-sub">
          {item.submenu.map((subitem, subitemIndex) => (
            <MenuItem
              key={subitem.link || `subitem-${subitemIndex}`}
              item={subitem}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default Sidebar;
