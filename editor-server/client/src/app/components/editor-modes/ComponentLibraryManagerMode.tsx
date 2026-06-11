import React from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import CreateCategoryModal from '../editor/CreateCategoryModal';
import CreateComponentModal from '../editor/CreateComponentModal';
import ComponentEditPanel from './library/ComponentEditPanel';
import './ComponentLibraryManagerMode.css';

const ComponentLibraryManagerMode: React.FC = () => {
  const clStore = useComponentLibraryStore();

  const updateLibrary = clStore.updateLibrary;
  const updateCategory = clStore.updateCategory;
  const updateComponent = clStore.updateComponent;
  const deleteLibrary = clStore.removeLibrary;
  const deleteCategory = clStore.deleteCategory;
  const deleteComponent = clStore.deleteComponent;
  const reorderLibrary = clStore.reorderLibrary;
  const reorderCategory = clStore.reorderCategory;
  const reorderComponent = clStore.reorderComponent;
  const moveComponent = clStore.moveComponent;
  const moveCategory = clStore.moveCategory;
  const setSelectedNode = clStore.setSelectedNode;

  const [showCreateCatModal, setShowCreateCatModal] = React.useState(false);
  const [showCreateCompModal, setShowCreateCompModal] = React.useState(false);
  const [createCtx, setCreateCtx] = React.useState<{
    libraryId?: string;
    categoryId?: string | null;
  }>({});

  const selectedLibrary = React.useMemo(() => {
    if (clStore.selectedLibraryId) {
      return clStore.libraries.find(lib => lib.metadata.id === clStore.selectedLibraryId) || null;
    }
    return null;
  }, [clStore.libraries, clStore.selectedLibraryId]);

  const selectedCategory = React.useMemo(() => {
    if (!selectedLibrary || !clStore.selectedCategoryId) return null;
    return selectedLibrary.categories.find(cat => cat.id === clStore.selectedCategoryId) || null;
  }, [selectedLibrary, clStore.selectedCategoryId]);

  const selectedComponent = React.useMemo(() => {
    if (!selectedLibrary || !clStore.selectedComponentId) return null;
    return selectedLibrary.components.find(comp => comp.internalId === clStore.selectedComponentId) || null;
  }, [selectedLibrary, clStore.selectedComponentId]);

  const handleCreateCategory = React.useCallback((libraryId?: string, categoryId?: string | null) => {
    setCreateCtx({ libraryId, categoryId });
    setShowCreateCatModal(true);
  }, []);

  const handleCreateComponent = React.useCallback((libraryId?: string, categoryId?: string | null) => {
    setCreateCtx({ libraryId, categoryId });
    setShowCreateCompModal(true);
  }, []);

  const handleDeleteLibrary = React.useCallback(async (libraryId: string) => {
    await deleteLibrary(libraryId);
  }, [deleteLibrary]);

  const handleDeleteCategory = React.useCallback(async (libraryId: string, categoryId: string) => {
    await deleteCategory(libraryId, categoryId);
  }, [deleteCategory]);

  const handleDeleteComponent = React.useCallback(async (libraryId: string, componentId: string) => {
    await deleteComponent(libraryId, componentId);
  }, [deleteComponent]);

  return (
    <div className="clm-container">
      <div className="clm-edit-panel-wrapper">
        <ComponentEditPanel
          selectedLibrary={selectedLibrary}
          selectedCategory={selectedCategory}
          selectedComponent={selectedComponent}
          selectedNodeType={clStore.selectedNodeType}
          allLibraries={clStore.libraries}
          onUpdateLibrary={(libraryId, updates) => updateLibrary(libraryId, updates)}
          onUpdateCategory={(libraryId, categoryId, updates) => updateCategory(libraryId, categoryId, updates)}
          onUpdateComponent={(libraryId, componentInternalId, updates) => updateComponent(libraryId, componentInternalId, updates)}
          onDeleteLibrary={handleDeleteLibrary}
          onDeleteCategory={handleDeleteCategory}
          onDeleteComponent={handleDeleteComponent}
          onReorderLibrary={reorderLibrary}
          onReorderCategory={reorderCategory}
          onReorderComponent={reorderComponent}
          onMoveComponent={moveComponent}
          onMoveCategory={moveCategory}
          onSetSelectedNode={setSelectedNode}
          onCreateCategory={handleCreateCategory}
          onCreateComponent={handleCreateComponent}
        />
      </div>

      {showCreateCatModal && (
        <CreateCategoryModal
          isOpen={showCreateCatModal}
          defaultLibraryId={createCtx.libraryId}
          onClose={() => setShowCreateCatModal(false)}
        />
      )}

      {showCreateCompModal && (
        <CreateComponentModal
          isOpen={showCreateCompModal}
          defaultLibraryId={createCtx.libraryId}
          defaultCategoryId={createCtx.categoryId}
          onClose={() => setShowCreateCompModal(false)}
        />
      )}
    </div>
  );
};

export default ComponentLibraryManagerMode;
