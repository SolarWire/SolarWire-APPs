import React from 'react';
import { ComponentLibrary, ComponentCategory, Component } from '../../../../shared/types/component';
import { TreeNodeType } from '../../../../app/stores/componentLibraryStore';
import { feedback } from '../../../../app/stores/feedbackStore';
import ComponentLibraryLibraryEditMode from '../ComponentLibraryLibraryEditMode';
import ComponentLibraryCategoryEditMode from '../ComponentLibraryCategoryEditMode';
import ComponentLibraryComponentEditMode from '../ComponentLibraryComponentEditMode';

type ReorderDirection = 'top' | 'up' | 'down' | 'bottom';

interface ComponentEditPanelProps {
  selectedLibrary: ComponentLibrary | null;
  selectedCategory: ComponentCategory | null;
  selectedComponent: Component | null;
  selectedNodeType: TreeNodeType | null;
  allLibraries: ComponentLibrary[];
  onUpdateLibrary: (libraryId: string, updates: Partial<ComponentLibrary>) => void;
  onUpdateCategory: (libraryId: string, categoryId: string, updates: Partial<ComponentCategory>) => void;
  onUpdateComponent: (libraryId: string, componentInternalId: string, updates: Partial<Component>) => void;
  onDeleteLibrary: (libraryId: string) => Promise<void>;
  onDeleteCategory: (libraryId: string, categoryId: string) => Promise<void>;
  onDeleteComponent: (libraryId: string, componentInternalId: string) => Promise<void>;
  onReorderLibrary: (libraryId: string, direction: ReorderDirection) => void;
  onReorderCategory: (libraryId: string, categoryId: string, direction: ReorderDirection) => void;
  onReorderComponent: (libraryId: string, componentId: string, direction: ReorderDirection) => void;
  onMoveComponent: (sourceLibraryId: string, componentInternalId: string, targetLibraryId: string, targetCategoryId: string | null, targetComponentInternalId: string, position: 'before' | 'after') => void;
  onMoveCategory: (sourceLibraryId: string, categoryId: string, targetLibraryId: string, targetCategoryId: string | null, position: 'before' | 'after' | 'inside') => void;
  onSetSelectedNode: (nodeId: string | null, nodeType: TreeNodeType | null, libraryId: string | null) => void;
  onCreateCategory: (libraryId: string, categoryId?: string) => void;
  onCreateComponent: (libraryId: string, categoryId?: string | null) => void;
}

const ComponentEditPanel: React.FC<ComponentEditPanelProps> = ({
  selectedLibrary,
  selectedCategory,
  selectedComponent,
  selectedNodeType,
  allLibraries,
  onUpdateLibrary,
  onUpdateCategory,
  onUpdateComponent,
  onDeleteLibrary,
  onDeleteCategory,
  onDeleteComponent,
  onReorderLibrary,
  onReorderCategory,
  onReorderComponent,
  onMoveComponent,
  onMoveCategory,
  onSetSelectedNode,
  onCreateCategory,
  onCreateComponent,
}) => {
  if (!selectedLibrary) {
    return (
      <div className="clm-edit-panel-empty">
        <div className="clm-empty-state">
          <div className="clm-empty-icon">📦</div>
          <div className="clm-empty-text">选择一个组件库、分类或组件进行编辑</div>
        </div>
      </div>
    );
  }

  if (selectedComponent) {
    return (
      <ComponentLibraryComponentEditMode
        library={selectedLibrary}
        component={selectedComponent}
        allLibraries={allLibraries}
        onUpdate={(updates) => onUpdateComponent(selectedLibrary.metadata.id, selectedComponent.internalId, updates)}
        onReorder={(direction) => {
          onReorderComponent(selectedLibrary.metadata.id, selectedComponent.internalId, direction);
        }}
        onChangeParent={() => {
          console.log('Change component parent');
        }}
        onChangeLibrary={async (newLibraryId, newCategoryId) => {
          try {
            await onMoveComponent(
              selectedLibrary.metadata.id,
              selectedComponent.internalId,
              newLibraryId,
              newCategoryId || null,
              '',
              'after'
            );
            onSetSelectedNode(selectedComponent.internalId, 'component', newLibraryId);
            feedback.toast.success('组件已移动到新组件库');
          } catch (error) {
            feedback.toast.error('移动组件失败: ' + (error as Error).message);
          }
        }}
        onDelete={async () => {
          const confirmed = await feedback.confirm({
            title: '删除组件',
            message: '确定要删除此组件吗？',
            type: 'danger',
            confirmText: '删除',
          });
          if (confirmed) {
            await onDeleteComponent(selectedLibrary.metadata.id, selectedComponent.internalId);
            onSetSelectedNode(null, null, null);
          }
        }}
      />
    );
  }

  if (selectedCategory) {
    return (
      <ComponentLibraryCategoryEditMode
        library={selectedLibrary}
        category={selectedCategory}
        allLibraries={allLibraries}
        onUpdate={(updates) => onUpdateCategory(selectedLibrary.metadata.id, selectedCategory.id, updates)}
        onCreateComponent={() => {
          onCreateComponent(selectedLibrary.metadata.id, selectedCategory.id);
        }}
        onReorder={(direction) => {
          onReorderCategory(selectedLibrary.metadata.id, selectedCategory.id, direction);
        }}
        onChangeParent={() => {
          console.log('Change category parent');
        }}
        onChangeLibrary={async (newLibraryId) => {
          try {
            await onMoveCategory(
              selectedLibrary.metadata.id,
              selectedCategory.id,
              newLibraryId,
              null,
              'after'
            );
            onSetSelectedNode(selectedCategory.id, 'category', newLibraryId);
            feedback.toast.success('分类已移动到新组件库');
          } catch (error) {
            feedback.toast.error('移动分类失败: ' + (error as Error).message);
          }
        }}
        onDelete={async () => {
          const confirmed = await feedback.confirm({
            title: '删除分类',
            message: '确定要删除此分类吗？',
            type: 'danger',
            confirmText: '删除',
          });
          if (confirmed) {
            await onDeleteCategory(selectedLibrary.metadata.id, selectedCategory.id);
            onSetSelectedNode(null, null, null);
          }
        }}
      />
    );
  }

  return (
    <ComponentLibraryLibraryEditMode
      library={selectedLibrary}
      onUpdate={(updates) => onUpdateLibrary(selectedLibrary.metadata.id, updates)}
      onCreateCategory={() => {
        onCreateCategory(selectedLibrary.metadata.id);
      }}
      onCreateComponent={() => {
        onCreateComponent(selectedLibrary.metadata.id);
      }}
      onReorder={(direction) => {
        onReorderLibrary(selectedLibrary.metadata.id, direction);
      }}
      onDelete={async () => {
        const confirmed = await feedback.confirm({
          title: '删除组件库',
          message: `确定要删除组件库 "${selectedLibrary.metadata.name}" 吗？此操作不可撤销。`,
          type: 'danger',
          confirmText: '删除',
        });
        if (confirmed) {
          await onDeleteLibrary(selectedLibrary.metadata.id);
          onSetSelectedNode(null, null, null);
        }
      }}
    />
  );
};

export default ComponentEditPanel;
