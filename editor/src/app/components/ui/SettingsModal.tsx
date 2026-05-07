import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Language } from '../../i18n';
import { feedback } from '../../stores/feedbackStore';
import { useAppStore } from '../../stores/appStore';
import { THEME_LIST, Theme } from '../../../shared/types/app';
import ModalPortal from './ModalPortal';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  const { primaryColor, setPrimaryColor } = useSettingsStore();
  const { language, setLanguage } = useI18nStore();
  const { theme, setTheme } = useAppStore();
  const t = useTranslation();
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const [tempLanguage, setTempLanguage] = useState(language);
  const [colorError, setColorError] = useState('');
  const DEFAULT_PRIMARY_COLOR = '#FCA506';

  useEffect(() => {
    setTempPrimaryColor(primaryColor);
    setTempLanguage(language);
    setColorError('');
  }, [primaryColor, language, isOpen]);

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

  const isValidColor = (color: string): boolean => {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  };

  const handleSave = () => {
    if (!isValidColor(tempPrimaryColor)) {
      setColorError('Invalid color format. Use hex format like #FCA506');
      feedback.toast.error('Invalid color format');
      return;
    }
    setPrimaryColor(tempPrimaryColor);
    setLanguage(tempLanguage);
    onClose();
  };

  const handleResetColor = () => {
    setTempPrimaryColor(DEFAULT_PRIMARY_COLOR);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal><div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
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
            <div className="settings-field">
              <label>{t.settings.accentColor}</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={tempPrimaryColor}
                  onChange={(e) => setTempPrimaryColor(e.target.value)}
                />
                <div className="color-input-wrapper">
                  <input
                    type="text"
                    value={tempPrimaryColor}
                    onChange={(e) => {
                      setTempPrimaryColor(e.target.value);
                      if (isValidColor(e.target.value)) {
                        setColorError('');
                      }
                    }}
                    className={`color-input ${colorError ? 'color-input-error' : ''}`}
                  />
                  <button
                    className="color-reset-button"
                    onClick={handleResetColor}
                    title={t.common.reset}
                  >
                    {t.common.reset}
                  </button>
                </div>
                {colorError && <div className="color-error-message">{colorError}</div>}
              </div>
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
