import React, { useState, useEffect } from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Language } from '../../i18n';
import { useAppStore } from '../../stores/appStore';
import { THEME_LIST, Theme } from '../../../shared/types/app';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from './ModalPortal';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    api?: any;
  }
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  const { language, setLanguage } = useI18nStore();
  const { theme, setTheme } = useAppStore();
  const t = useTranslation();
  const [tempLanguage, setTempLanguage] = useState(language);
  const [isCopying, setIsCopying] = useState(false);

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

  const handleCopySkills = async () => {
    if (!window.api) {
      feedback.toast.error('Electron API not available');
      return;
    }

    try {
      setIsCopying(true);

      // 打开目录选择对话框
      const selectedDir = await window.api.openDirectory();
      
      if (!selectedDir) {
        // 用户取消了选择
        setIsCopying(false);
        return;
      }

      // 获取技能包源路径
      const appRoot = await window.api.getAppRoot();
      let skillsSourcePath;
      
      // 直接检查技能包位置
      const packagedPath = `${appRoot}/public/solarwire`;
      const devPath = `${appRoot}/sw-skills/solarwire`;
      
      // 优先检查打包环境路径
      if (await window.api.exists(packagedPath)) {
        skillsSourcePath = packagedPath;
        console.log('Using packaged skills path:', packagedPath);
      } else if (await window.api.exists(devPath)) {
        skillsSourcePath = devPath;
        console.log('Using development skills path:', devPath);
      } else {
        // 如果都找不到，使用开发路径作为默认
        skillsSourcePath = devPath;
        console.warn('Skills directory not found, using default path:', devPath);
        console.warn('Checked paths:', { packaged: packagedPath, dev: devPath });
      }

      // 目标路径
      const skillsDestPath = `${selectedDir}/solarwire`;

      // 复制技能包
      const result = await window.api.copyDirectory(skillsSourcePath, skillsDestPath);

      if (result.success) {
        feedback.toast.success(t.settings.skillsCopiedSuccess);
      } else {
        feedback.toast.error(`${t.settings.skillsCopyFailed}: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to copy skills:', error);
      feedback.toast.error(t.settings.skillsCopyFailed);
    } finally {
      setIsCopying(false);
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

          <div className="settings-section">
            <h3>{t.settings.skills}</h3>
            <div className="settings-field">
              <p className="settings-description">{t.settings.copySkillsDescription}</p>
              <button 
                className="settings-action-button"
                onClick={handleCopySkills}
                disabled={isCopying}
              >
                {isCopying ? t.settings.copyingSkills : t.settings.copySkillsButton}
              </button>
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
