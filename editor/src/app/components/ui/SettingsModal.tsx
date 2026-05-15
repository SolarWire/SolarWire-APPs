import React, { useState, useEffect } from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Language } from '../../i18n';
import { useAppStore } from '../../stores/appStore';
import { THEME_LIST } from '../../../shared/types/app';
import ModalPortal from './ModalPortal';
import './SettingsModal.css';

declare const __APP_VERSION__: string;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  const { language, setLanguage } = useI18nStore();
  const { theme, setTheme } = useAppStore();
  const t = useTranslation();
  const [tempLanguage, setTempLanguage] = useState(language);

  useEffect(() => {
    setTempLanguage(language);
  }, [language, isOpen]);

  // ESC键关闭模态窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    setLanguage(tempLanguage);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal><div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal glass-panel">
        <div className="settings-modal-header">
          <h2>{t.settings.title}</h2>
          <button className="settings-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-section">
            <h3>{t.settings.general}</h3>
            <div className="settings-field">
              <label>{t.settings.language}</label>
              <div className="language-selector">
                <select
                  value={tempLanguage}
                  onChange={(e) => setTempLanguage(e.target.value as Language)}
                  className="language-select"
                >
                  <option value="zh">{t.languages.zh}</option>
                  <option value="en">{t.languages.en}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>{t.settings.appearance}</h3>
            <div className="settings-field">
              <label>{t.settings.theme}</label>
              <div className="theme-selector">
                {THEME_LIST.map((item) => (
                  <button
                    key={item.id}
                    className={`theme-option ${theme === item.id ? 'theme-option-active' : ''}`}
                    onClick={() => setTheme(item.id)}
                    title={t.themes[item.id]}
                  >
                    <span className="theme-option-icon">{item.icon}</span>
                    <span className="theme-option-label">{t.themes[item.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-section settings-about">
            <h3>{t.settings.about}</h3>
            <div className="settings-about-content">
              <span className="settings-app-name">SolarWire Editor</span>
              <span className="settings-version">v{__APP_VERSION__}</span>
            </div>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button className="settings-cancel-button" onClick={onClose}>
            {t.common.cancel}
          </button>
          <button className="settings-save-button" onClick={handleSave}>
            {t.common.save}
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
}

export default SettingsModal;
