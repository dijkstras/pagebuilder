import React, { createContext, useContext, useReducer } from 'react';
import { createEmptyPage, createSegment, createContainer, createContentItem, migratePage } from './pageTypes';

const PageContext = createContext();

const initialState = {
  page: createEmptyPage(),
  selectedElementId: null,
  selectedElementType: null,
  activeBrandSection: null,
  saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  saveError: null
};

function pageReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: migratePage(action.payload) };

    case 'UPDATE_PAGE_SETTINGS':
      return {
        ...state,
        page: {
          ...state.page,
          ...action.payload
        }
      };

    case 'UPDATE_PAGE_STYLES':
      return {
        ...state,
        page: {
          ...state.page,
          styles: { ...state.page.styles, ...action.payload }
        }
      };

    case 'ADD_SEGMENT':
      return {
        ...state,
        page: {
          ...state.page,
          root: [...state.page.root, createSegment(action.payload)]
        }
      };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        page: updateElement(state.page, action.payload.id, action.payload.updates)
      };

    case 'MOVE_SEGMENT': {
      const { id, direction } = action.payload;
      const root = [...state.page.root];
      const idx = root.findIndex(s => s.id === id);
      if (idx === -1) return state;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= root.length) return state;
      [root[idx], root[newIdx]] = [root[newIdx], root[idx]];
      return { ...state, page: { ...state.page, root } };
    }

    case 'DELETE_ELEMENT':
      return {
        ...state,
        page: deleteElement(state.page, action.payload),
        selectedElementId: null,
        selectedElementType: null
      };

    case 'DUPLICATE_ELEMENT': {
      const { page: newPage, cloneId } = duplicateElementInPage(state.page, action.payload.id);
      return {
        ...state,
        page: newPage,
        selectedElementId: cloneId,
        selectedElementType: action.payload.elementType
      };
    }

    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload.id,
        selectedElementType: action.payload.elementType,
        activeBrandSection: null
      };

    case 'DESELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: null,
        selectedElementType: null
      };

    case 'SELECT_BRAND_SECTION':
      return {
        ...state,
        activeBrandSection: action.payload,
        selectedElementId: null,
        selectedElementType: null
      };

    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload.status,
        saveError: action.payload.error || null
      };

    case 'CLEAR_SAVE_ERROR':
      return {
        ...state,
        saveError: null
      };

    default:
      return state;
  }
}

function updateElement(page, elementId, updates) {
  const findAndUpdate = (element) => {
    if (element.id === elementId) {
      return { ...element, ...updates };
    }
    if (element.children) {
      return {
        ...element,
        children: element.children.map(findAndUpdate)
      };
    }
    return element;
  };

  return {
    ...page,
    root: page.root.map(findAndUpdate)
  };
}

function deleteElement(page, elementId) {
  const findAndDelete = (children) => {
    if (!children) return children;
    return children
      .filter(child => child.id !== elementId)
      .map(child => ({
        ...child,
        children: child.children ? findAndDelete(child.children) : child.children
      }));
  };

  return {
    ...page,
    root: findAndDelete(page.root)
  };
}

export function deepCloneElement(element) {
  const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...element,
    id: newId,
    children: element.children?.map(deepCloneElement)
  };
}

export function duplicateElementInPage(page, elementId) {
  let cloneId = null;

  const insertAfterInArray = (arr) => {
    const idx = arr.findIndex(item => item.id === elementId);
    if (idx !== -1) {
      const clone = deepCloneElement(arr[idx]);
      cloneId = clone.id;
      const newArr = [...arr];
      newArr.splice(idx + 1, 0, clone);
      return newArr;
    }
    return arr.map(item => ({
      ...item,
      children: item.children ? insertAfterInArray(item.children) : item.children
    }));
  };

  return {
    page: { ...page, root: insertAfterInArray(page.root) },
    cloneId
  };
}

export function PageProvider({ children }) {
  const [state, dispatch] = useReducer(pageReducer, initialState);

  return (
    <PageContext.Provider value={{ state, dispatch }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageStore() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageStore must be used within PageProvider');
  }
  return context;
}

export const pageActions = {
  setPage: (page) => ({ type: 'SET_PAGE', payload: page }),
  updatePageSettings: (updates) => ({ type: 'UPDATE_PAGE_SETTINGS', payload: updates }),
  updatePageStyles: (styles) => ({ type: 'UPDATE_PAGE_STYLES', payload: styles }),
  addSegment: (name) => ({ type: 'ADD_SEGMENT', payload: name }),
  updateElement: (id, updates) => ({ type: 'UPDATE_ELEMENT', payload: { id, updates } }),
  moveSegment: (id, direction) => ({ type: 'MOVE_SEGMENT', payload: { id, direction } }),
  deleteElement: (id) => ({ type: 'DELETE_ELEMENT', payload: id }),
  duplicateElement: (id, elementType) => ({ type: 'DUPLICATE_ELEMENT', payload: { id, elementType } }),
  selectElement: (id, elementType) => ({ type: 'SELECT_ELEMENT', payload: { id, elementType } }),
  deselectElement: () => ({ type: 'DESELECT_ELEMENT' }),
  selectBrandSection: (section) => ({ type: 'SELECT_BRAND_SECTION', payload: section }),
  setSaveStatus: (status, error = null) => ({
    type: 'SET_SAVE_STATUS',
    payload: { status, error }
  }),
  clearSaveError: () => ({ type: 'CLEAR_SAVE_ERROR' })
};
