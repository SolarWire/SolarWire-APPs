import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import './ColorPicker.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * 颜色选择器组件
 * 支持预设颜色和自定义颜色选择
 */
export function ColorPicker({ label, value, onChange }: ColorPickerProps): React.JSX.Element {
  const { favoriteColors, addFavoriteColor, removeFavoriteColor, resetFavoriteColors, primaryColor } = useSettingsStore();
  const [showPresets, setShowPresets] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPresets && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (presetsRef.current && !presetsRef.current.contains(event.target as Node)) {
          setShowPresets(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresets]);

  const getPopupPosition = () => {
    if (!wrapperRef.current) return { top: 0, left: 0 };
    const rect = wrapperRef.current.getBoundingClientRect();
    const popupWidth = 180;
    const popupHeight = 300;
    let top = rect.bottom + 4;
    let left = rect.left;
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 8;
    }
    if (left < 0) left = 0;
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 4;
    }
    if (top < 0) top = rect.bottom + 4;
    return { top, left };
  };

  const popupStyle = getPopupPosition();

  const presetsMenu = showPresets && createPortal(
    <div
      ref={presetsRef}
      className="color-picker-popup"
      style={{
        position: 'fixed',
        top: popupStyle.top,
        left: popupStyle.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="color-picker-section">
        <div className="color-picker-section-title">Preset Colors</div>
        <div className="color-picker-grid">
          {favoriteColors.map((color, index) => (
            <button
              key={index}
              className="color-picker-swatch"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setShowPresets(false);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                removeFavoriteColor(color);
              }}
              title="Click to select, Right click to remove"
            />
          ))}
        </div>
      </div>
      <div className="color-picker-divider"></div>
      <button className="color-picker-add" onClick={() => addFavoriteColor(value)}>
        + Add Current Color
      </button>
      <button
        className="color-picker-reset"
        style={{ color: primaryColor }}
        onClick={() => resetFavoriteColors()}
      >
        Reset to Default
      </button>
    </div>,
    document.body
  );

  return (
    <div className="property-group color-picker-group" ref={wrapperRef}>
      <label>{label}</label>
      <div className="color-picker-wrapper">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          className="color-picker-toggle"
          onClick={() => setShowPresets(!showPresets)}
          title="Preset colors"
        >
          ▼
        </button>
      </div>
      {presetsMenu}
    </div>
  );
}

export default ColorPicker;
