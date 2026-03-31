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

    case 'DELETE_ELEMENT':
      return {
        ...state,
        page: deleteElement(state.page, action.payload),
        selectedElementId: null,
        selectedElementType: null
      };

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
  deleteElement: (id) => ({ type: 'DELETE_ELEMENT', payload: id }),
  selectElement: (id, elementType) => ({ type: 'SELECT_ELEMENT', payload: { id, elementType } }),
  deselectElement: () => ({ type: 'DESELECT_ELEMENT' }),
  selectBrandSection: (section) => ({ type: 'SELECT_BRAND_SECTION', payload: section }),
  setSaveStatus: (status, error = null) => ({
    type: 'SET_SAVE_STATUS',
    payload: { status, error }
  }),
  clearSaveError: () => ({ type: 'CLEAR_SAVE_ERROR' })
};
