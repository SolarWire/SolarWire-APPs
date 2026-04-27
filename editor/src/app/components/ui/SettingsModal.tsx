import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  const { primaryColor, setPrimaryColor } = useSettingsStore();
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const DEFAULT_PRIMARY_COLOR = '#FCA506';

  useEffect(() => {
    setTempPrimaryColor(primaryColor);
  }, [primaryColor, isOpen]);

  const handleSave = () => {
    setPrimaryColor(tempPrimaryColor);
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
          <h2>Settings</h2>
          <button className="settings-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="settings-field">
              <label>Color</label>
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
                    onChange={(e) => setTempPrimaryColor(e.target.value)}
                    className="color-input"
                  />
                  <button
                    className="color-reset-button"
                    onClick={handleResetColor}
                    title="Reset to default"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button className="settings-cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="settings-save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
