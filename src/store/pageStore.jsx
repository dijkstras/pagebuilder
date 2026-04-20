import React, { createContext, useContext, useReducer } from 'react';
import { createEmptyPage, createSegment, createSlot, createContentItem, migratePage, LAYOUT_PRESETS } from './pageTypes';

const PageContext = createContext();

const initialState = {
  page: createEmptyPage(),
  selectedElementId: null,
  selectedElementType: null,
  activeBrandSection: null,
  saveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  saveError: null,
  lastSaved: null,
  currentView: 'grid', // 'grid' | 'editor'
  viewportMode: 'desktop' // 'desktop' | 'mobile'
};

function pageReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      try {
        const migratedPage = migratePage(action.payload);
        return { ...state, page: migratedPage };
      } catch (error) {
        console.error('Error migrating page:', error);
        console.error('Page data:', action.payload);
        throw error;
      }

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

    case 'UPDATE_PAGE_MOBILE_OVERRIDES':
      return {
        ...state,
        page: {
          ...state.page,
          mobileOverrides: { ...(state.page.mobileOverrides ?? {}), ...action.payload }
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

    case 'ADD_SEGMENT_FROM_DATA':
      return {
        ...state,
        page: {
          ...state.page,
          root: [...state.page.root, action.payload]
        }
      };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        page: updateElement(state.page, action.payload.id, action.payload.updates)
      };

    case 'MOVE_ELEMENT': {
      const { id, direction } = action.payload;
      
      const findAndMoveInArray = (children) => {
        if (!children) return children;
        
        const idx = children.findIndex(child => child.id === id);
        if (idx !== -1) {
          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= children.length) return children;
          const newChildren = [...children];
          [newChildren[idx], newChildren[newIdx]] = [newChildren[newIdx], newChildren[idx]];
          return newChildren;
        }
        
        return children.map(child => ({
          ...child,
          children: child.children ? findAndMoveInArray(child.children) : child.children
        }));
      };

      return {
        ...state,
        page: {
          ...state.page,
          root: findAndMoveInArray(state.page.root)
        }
      };
    }

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

    case 'DELETE_SEGMENT': {
      const root = state.page.root.filter(s => s.id !== action.payload);
      return {
        ...state,
        page: { ...state.page, root },
        selectedElementId: null,
        selectedElementType: null
      };
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
        saveError: action.payload.error || null,
        lastSaved: action.payload.status === 'saved' ? new Date().toISOString() : state.lastSaved
      };

    case 'CLEAR_SAVE_ERROR':
      return {
        ...state,
        saveError: null
      };

    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload
      };

    case 'SET_VIEWPORT_MODE':
      return {
        ...state,
        viewportMode: action.payload
      };

    case 'SET_LAYOUT': {
      const { segmentId, layoutKey } = action.payload;
      const preset = LAYOUT_PRESETS[layoutKey];
      if (!preset) return state;

      const updateSegmentLayout = (segment) => {
        if (segment.id !== segmentId) return segment;

        const existingSlots = segment.children.filter(c => c.type === 'slot' || c.type === 'container');
        const newSlotCount = preset.slots.length;
        let newSlots;

        if (existingSlots.length <= newSlotCount) {
          // Keep existing slots, add empty ones as needed
          newSlots = existingSlots.map((slot, i) => ({
            ...slot,
            type: 'slot',
            settings: { ...slot.settings, gridColumn: preset.slots[i] }
          }));
          for (let i = existingSlots.length; i < newSlotCount; i++) {
            newSlots.push(createSlot(`Column ${i + 1}`, preset.slots[i]));
          }
        } else {
          // Reducing slots — merge overflow content into last remaining slot
          newSlots = existingSlots.slice(0, newSlotCount).map((slot, i) => ({
            ...slot,
            type: 'slot',
            settings: { ...slot.settings, gridColumn: preset.slots[i] }
          }));
          // Merge children from removed slots into the last kept slot
          const overflow = existingSlots.slice(newSlotCount);
          const mergedChildren = overflow.reduce((acc, slot) => [...acc, ...(slot.children || [])], []);
          if (mergedChildren.length > 0) {
            const lastIdx = newSlots.length - 1;
            newSlots[lastIdx] = {
              ...newSlots[lastIdx],
              children: [...(newSlots[lastIdx].children || []), ...mergedChildren]
            };
          }
        }

        return {
          ...segment,
          settings: { ...segment.settings, layout: layoutKey },
          children: newSlots
        };
      };

      return {
        ...state,
        page: {
          ...state.page,
          root: state.page.root.map(updateSegmentLayout)
        }
      };
    }

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
  updatePageMobileOverrides: (overrides) => ({ type: 'UPDATE_PAGE_MOBILE_OVERRIDES', payload: overrides }),
  addSegment: (name) => ({ type: 'ADD_SEGMENT', payload: name }),
  updateElement: (id, updates) => ({ type: 'UPDATE_ELEMENT', payload: { id, updates } }),
  moveElement: (id, direction) => ({ type: 'MOVE_ELEMENT', payload: { id, direction } }),
  moveSegment: (id, direction) => ({ type: 'MOVE_SEGMENT', payload: { id, direction } }),
  deleteSegment: (id) => ({ type: 'DELETE_SEGMENT', payload: id }),
  deleteElement: (id) => ({ type: 'DELETE_ELEMENT', payload: id }),
  duplicateElement: (id, elementType) => ({ type: 'DUPLICATE_ELEMENT', payload: { id, elementType } }),
  selectElement: (id, elementType) => ({ type: 'SELECT_ELEMENT', payload: { id, elementType } }),
  deselectElement: () => ({ type: 'DESELECT_ELEMENT' }),
  selectBrandSection: (section) => ({ type: 'SELECT_BRAND_SECTION', payload: section }),
  setSaveStatus: (status, error = null) => ({
    type: 'SET_SAVE_STATUS',
    payload: { status, error }
  }),
  clearSaveError: () => ({ type: 'CLEAR_SAVE_ERROR' }),
  setView: (view) => ({ type: 'SET_VIEW', payload: view }),
  setViewportMode: (mode) => ({ type: 'SET_VIEWPORT_MODE', payload: mode }),
  setLayout: (segmentId, layoutKey) => ({ type: 'SET_LAYOUT', payload: { segmentId, layoutKey } })
};
