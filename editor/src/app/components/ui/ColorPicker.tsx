import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker, HexColorInput, RgbColorPicker } from 'react-colorful';
import PropertyLabel from '../editor/property/PropertyLabel';
import { PROPERTY_META } from '../editor/property/propertyMeta';
import './ColorPicker.css';

const STORAGE_KEY = 'solarwire-color-presets';

const DEFAULT_PRESETS = [
  '#ff0000', '#ff5500', '#ffaa00', '#ffff00', '#aaff00',
  '#00ff00', '#00ffaa', '#00ffff', '#00aaff', '#0055ff',
  '#0000ff', '#5500ff', '#aa00ff', '#ff00ff', '#ff00aa',
  '#ffffff', '#cccccc', '#888888', '#444444', '#000000',
];

const loadPresets = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PRESETS;
};

const savePresets = (presets: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
};

const normalizeHex = (color: string): string => {
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return color.toLowerCase();
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = normalizeHex(hex);
  const result = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(normalized);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
};

const calculatePosition = (triggerEl: HTMLElement) => {
  const rect = triggerEl.getBoundingClientRect();
  const popupHeight = 420;
  const popupWidth = 224;

  let top = rect.bottom + 4;
  let left = rect.left;

  if (top + popupHeight > window.innerHeight) {
    top = rect.top - popupHeight - 4;
  }
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 8;
  }
  if (left < 8) left = 8;

  return { top, left };
};

type ColorMode = 'hex' | 'rgb';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  color: string;
  index: number;
}

const INITIAL_CONTEXT_MENU: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  color: '',
  index: -1,
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  codeAttr?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, codeAttr }) => {
  const [presets, setPresets] = useState<string[]>(loadPresets);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [localColor, setLocalColor] = useState(value);
  const [colorMode, setColorMode] = useState<ColorMode>('hex');
  const [rgbValue, setRgbValue] = useState(hexToRgb(value));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_CONTEXT_MENU);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupPosRef = useRef({ top: 0, left: 0 });

  useEffect(() => {
    setLocalColor(value);
    setRgbValue(hexToRgb(value));
  }, [value]);

  useEffect(() => {
    if (!showPopup) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popupRef.current?.contains(target) ||
        (target as HTMLElement).closest('.color-picker-context-menu')
      ) {
        return;
      }
      setShowPopup(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showPopup]);

  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.color-picker-context-menu')) return;
      setContextMenu(INITIAL_CONTEXT_MENU);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [contextMenu.visible]);

  const handleSwatchClick = useCallback(() => {
    if (!showPopup && containerRef.current) {
      const pos = calculatePosition(containerRef.current);
      popupPosRef.current = pos;
      setPopupPos(pos);
    }
    setShowPopup(prev => !prev);
  }, [showPopup]);

  const handleColorChange = useCallback((color: string) => {
    setLocalColor(color);
    setRgbValue(hexToRgb(color));
    onChange(color);
  }, [onChange]);

  const handleRgbChange = useCallback((rgb: { r: number; g: number; b: number }) => {
    setRgbValue(rgb);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setLocalColor(hex);
    onChange(hex);
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    onChange(color);
  }, [onChange]);

  const handlePresetContextMenu = useCallback((e: React.MouseEvent, color: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      color,
      index,
    });
  }, []);

  const handleRemovePreset = useCallback(() => {
    setPresets(prev => {
      const next = prev.filter((_, i) => i !== contextMenu.index);
      savePresets(next.length > 0 ? next : DEFAULT_PRESETS);
      return next.length > 0 ? next : DEFAULT_PRESETS;
    });
    setContextMenu(INITIAL_CONTEXT_MENU);
  }, [contextMenu.index]);

  const handleAddPreset = useCallback(() => {
    const normalized = normalizeHex(value);
    setPresets(prev => {
      if (prev.includes(normalized)) return prev;
      const next = [...prev, normalized];
      savePresets(next);
      return next;
    });
  }, [value]);

  const handleResetPresets = useCallback(() => {
    setPresets(DEFAULT_PRESETS);
    savePresets(DEFAULT_PRESETS);
  }, []);

  const handleEyeDropper = useCallback(async () => {
    if (!('EyeDropper' in window)) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      handleColorChange(result.sRGBHex);
    } catch {}
  }, [handleColorChange]);

  const supportsEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const contextMenuPortal = contextMenu.visible && createPortal(
    <div
      className="color-picker-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      <button
        className="color-picker-context-item color-picker-context-remove"
        onClick={handleRemovePreset}
      >
        Remove Preset
      </button>
    </div>,
    document.body
  );

  const popup = showPopup && createPortal(
    <div
      ref={popupRef}
      className="color-picker-popup"
      style={{ top: popupPosRef.current.top, left: popupPosRef.current.left }}
    >
      {colorMode === 'hex' ? (
        <HexColorPicker color={localColor} onChange={handleColorChange} />
      ) : (
        <RgbColorPicker color={rgbValue} onChange={handleRgbChange} />
      )}

      <div className="color-picker-input-section">
        <div className="color-picker-mode-tabs">
          <button
            className={`color-picker-mode-tab${colorMode === 'hex' ? ' active' : ''}`}
            onClick={() => setColorMode('hex')}
          >HEX</button>
          <button
            className={`color-picker-mode-tab${colorMode === 'rgb' ? ' active' : ''}`}
            onClick={() => setColorMode('rgb')}
          >RGB</button>
          {supportsEyeDropper && (
            <button
              className="color-picker-eyedropper-btn"
              onClick={handleEyeDropper}
              title="Pick color from screen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22l1-1h3l9-9"/>
                <path d="M3 21v-3l9-9"/>
                <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"/>
              </svg>
            </button>
          )}
        </div>
        {colorMode === 'hex' ? (
          <HexColorInput
            color={localColor}
            onChange={handleColorChange}
            prefixed
            className="color-picker-popup-hex-input"
          />
        ) : (
          <div className="color-picker-rgb-inputs">
            <div className="color-picker-rgb-field">
              <label>R</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgbValue.r}
                onChange={(e) => handleRgbChange({ ...rgbValue, r: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="color-picker-rgb-field">
              <label>G</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgbValue.g}
                onChange={(e) => handleRgbChange({ ...rgbValue, g: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="color-picker-rgb-field">
              <label>B</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgbValue.b}
                onChange={(e) => handleRgbChange({ ...rgbValue, b: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="color-picker-presets-section">
        <div className="color-picker-presets-header">
          <span className="color-picker-presets-title">Presets</span>
          <button className="color-picker-reset-btn" onClick={handleResetPresets}>Reset</button>
        </div>
        <div className="color-picker-presets">
          {presets.map((color, i) => (
            <button
              key={`${color}-${i}`}
              className={`color-picker-preset-item${color.toLowerCase() === value.toLowerCase() ? ' active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetClick(color)}
              onContextMenu={(e) => handlePresetContextMenu(e, color, i)}
              title={color}
            />
          ))}
          <button
            className="color-picker-preset-add"
            onClick={handleAddPreset}
            title="Save current color to presets"
          >
            +
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="color-picker" ref={containerRef}>
      <PropertyLabel codeAttr={codeAttr || ''} fallbackLabel={label} className="color-picker-label" />
      <button
        className="color-picker-swatch"
        style={{ backgroundColor: value }}
        onClick={handleSwatchClick}
        title={value}
      />
      <HexColorInput
        color={value}
        onChange={onChange}
        prefixed
        className="color-picker-inline-hex"
      />
      {popup}
      {contextMenuPortal}
    </div>
  );
};

export default ColorPicker;
