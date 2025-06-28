import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'uz', name: t('language.uzbek'), flag: '🇺🇿' },
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'ru', name: t('language.russian'), flag: '🇷🇺' },
  ];

  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = langCode => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle hide-arrow"
        href="#"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span className="me-1">{currentLanguage.flag}</span>
        <span className="fw-medium">{currentLanguage.name}</span>
      </a>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <h6 className="dropdown-header">{t('language.select')}</h6>
        </li>
        {languages.map(language => (
          <li key={language.code}>
            <a
              className={`dropdown-item ${i18n.language === language.code ? 'active' : ''}`}
              href="#"
              onClick={e => {
                e.preventDefault();
                changeLanguage(language.code);
              }}
            >
              <span className="me-2">{language.flag}</span>
              <span>{language.name}</span>
              {i18n.language === language.code && (
                <i className="bx bx-check ms-auto"></i>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSwitcher;
