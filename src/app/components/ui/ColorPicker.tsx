import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import './ColorPicker.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const { favoriteColors, addFavoriteColor, removeFavoriteColor } = useSettingsStore();
  const [showMenu, setShowMenu] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // 检查是否是有效的十六进制颜色值
  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };
  
  // 如果当前值不是有效的十六进制颜色，使用默认值
  const colorValue = isValidHexColor(value) ? value : '#000000';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="property-group color-picker-group" ref={wrapperRef}>
      <label>{label}</label>
      <div className="color-picker-wrapper">
        <input
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="color-picker-dropdown">
          <button
            className="color-picker-toggle"
            onClick={() => setShowMenu(!showMenu)}
            title="Favorite colors"
          >
            ▼
          </button>
          {showMenu && (
            <div className="color-picker-menu" onClick={(e) => e.stopPropagation()}>
              <div className="color-picker-section">
                <div className="color-picker-section-title">Favorite Colors</div>
                <div className="color-picker-grid">
                  {favoriteColors.map((color, index) => (
                    <button
                      key={index}
                      className="color-picker-swatch"
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        if (e.button === 2) {
                          e.preventDefault();
                          removeFavoriteColor(color);
                        } else {
                          onChange(color);
                          setShowMenu(false);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        removeFavoriteColor(color);
                      }}
                      title={`Click to select, Right click to remove`}
                    />
                  ))}
                </div>
              </div>
              <div className="color-picker-divider"></div>
              <button
                className="color-picker-add"
                onClick={() => {
                  addFavoriteColor(value);
                }}
              >
                Add Current Color
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
