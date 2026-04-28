import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Language } from '../../i18n';
import { showToast } from '../../services/toast-service';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  const { primaryColor, setPrimaryColor, renderMode, setRenderMode } = useSettingsStore();
  const { language, setLanguage } = useI18nStore();
  const t = useTranslation();
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const [tempLanguage, setTempLanguage] = useState(language);
  const [tempRenderMode, setTempRenderMode] = useState(renderMode);
  const [colorError, setColorError] = useState('');
  const DEFAULT_PRIMARY_COLOR = '#FCA506';

  useEffect(() => {
    setTempPrimaryColor(primaryColor);
    setTempLanguage(language);
    setTempRenderMode(renderMode);
    setColorError('');
  }, [primaryColor, language, renderMode, isOpen]);

  const isValidColor = (color: string): boolean => {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  };

  const handleSave = () => {
    if (!isValidColor(tempPrimaryColor)) {
      setColorError('Invalid color format. Use hex format like #FCA506');
      showToast('Invalid color format', 'error');
      return;
    }
    setPrimaryColor(tempPrimaryColor);
    setLanguage(tempLanguage);
    setRenderMode(tempRenderMode);
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
    <div className="settings-modal-overlay" onClick={handleOverlayClick}>
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
            <div className="settings-field">
              <label>渲染模式 / Render Mode</label>
              <div className="language-selector">
                <select
                  value={tempRenderMode}
                  onChange={(e) => setTempRenderMode(e.target.value as 'svg' | 'canvas')}
                  className="language-select"
                >
                  <option value="svg">SVG</option>
                  <option value="canvas">Canvas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>{t.settings.appearance}</h3>
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
    </div>
  );
}

export default SettingsModal;
