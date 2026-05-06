import { create } from 'zustand';

// 选择工具类型
type SelectionTool = 'select' | 'box-include' | 'box-intersect';

/**
 * SolarWire 状态接口
 */
interface SolarWireState {
  /** 选中的元素 ID 列表 */
  selectedElements: string[];
  /** 当前选择工具 */
  selectionTool: SelectionTool;
  /** 是否处于平移模式 */
  isPanMode: boolean;
  /** 拖拽状态 */
  dragState: any;
  /** 调整大小状态 */
  resizeState: any;
  /** 是否显示备注 */
  showNotes: boolean;
  /** 空格键是否按下 */
  isSpacePressed: boolean;
  /** 预览是否聚焦 */
  isPreviewFocused: boolean;
  /** 选择元素 */
  selectElements: (ids: string[]) => void;
  /** 设置选中的元素 */
  setSelectedElements: (ids: string[]) => void;
  /** 设置选择工具 */
  setSelectionTool: (tool: SelectionTool) => void;
  /** 设置平移模式 */
  setIsPanMode: (isPanMode: boolean) => void;
  /** 设置拖拽状态 */
  setDragState: (state: any) => void;
  /** 设置调整大小状态 */
  setResizeState: (state: any) => void;
  /** 设置是否显示备注 */
  setShowNotes: (show: boolean) => void;
  /** 设置空格键按下状态 */
  setIsSpacePressed: (pressed: boolean) => void;
  /** 设置预览聚焦状态 */
  setIsPreviewFocused: (focused: boolean) => void;
}

/**
 * SolarWire 状态管理 Store
 * 管理 SolarWire 编辑器的选择、工具、视图等状态
 */
export const useSolarWireStore = create<SolarWireState>((set) => ({
  selectedElements: [],
  selectionTool: (() => {
    try {
      const saved = localStorage.getItem('solarwire-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectionTool) return parsed.selectionTool;
      }
    } catch {}
    return 'select';
  })(),
  isPanMode: false,
  dragState: null,
  resizeState: null,
  showNotes: true,
  isSpacePressed: false,
  isPreviewFocused: false,

  /**
   * 选择元素
   */
  selectElements: (ids: string[]) => set({ selectedElements: ids }),
  
  /**
   * 设置选中的元素
   */
  setSelectedElements: (ids: string[]) => set({ selectedElements: ids }),
  
  /**
   * 设置选择工具
   */
  setSelectionTool: (tool: SelectionTool) => {
    set({ selectionTool: tool });
    try {
      const saved = localStorage.getItem('solarwire-settings');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.selectionTool = tool;
      localStorage.setItem('solarwire-settings', JSON.stringify(parsed));
    } catch {}
  },
  
  /**
   * 设置平移模式
   */
  setIsPanMode: (isPanMode: boolean) => set({ isPanMode }),
  
  /**
   * 设置拖拽状态
   */
  setDragState: (state: any) => set({ dragState: state }),
  
  /**
   * 设置调整大小状态
   */
  setResizeState: (state: any) => set({ resizeState: state }),
  
  /**
   * 设置是否显示备注
   */
  setShowNotes: (show) => set({ showNotes: show }),
  
  /**
   * 设置空格键按下状态
   */
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
  setIsPreviewFocused: (focused) => set({ isPreviewFocused: focused }),
}));

export type { SelectionTool };
