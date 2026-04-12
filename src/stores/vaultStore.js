import { create } from 'zustand';
import figuresData from '../data/shf-dragonball.json';
import seriesData from '../data/series-definitions.json';

// --- IndexedDB Helpers ---
const DB_NAME = 'komic-vault';
const DB_VERSION = 1;
const STORE_NAME = 'collection';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'figureId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadCollection() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function saveCollectionItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeCollectionItem(figureId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(figureId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Store ---
const useVaultStore = create((set, get) => ({
  // --- Catalog ---
  figures: figuresData,
  seriesDefinitions: seriesData,

  // --- Navigation ---
  vaultView: 'home', // 'home' | 'franchise' | 'figure' | 'myVault' | 'series' | 'calendar'
  setVaultView: (view) => set({ vaultView: view }),

  activeFranchise: null,
  setActiveFranchise: (franchise) => set({ activeFranchise: franchise }),

  activeFigureId: null,
  setActiveFigureId: (id) => set({ activeFigureId: id }),

  activeSeriesId: null,
  setActiveSeriesId: (id) => set({ activeSeriesId: id }),

  // Navigate to a figure profile
  openFigure: (id) => set({ activeFigureId: id, vaultView: 'figure' }),

  // Navigate to a franchise
  openFranchise: (franchise) => set({ activeFranchise: franchise, vaultView: 'franchise' }),

  // Navigate back
  goBack: () => {
    const state = get();
    if (state.vaultView === 'figure') {
      set({ vaultView: state.activeFranchise ? 'franchise' : 'home', activeFigureId: null });
    } else if (state.vaultView === 'franchise') {
      set({ vaultView: 'home', activeFranchise: null });
    } else if (state.vaultView === 'series') {
      set({ vaultView: 'myVault', activeSeriesId: null });
    } else {
      set({ vaultView: 'home' });
    }
  },

  // --- Search & Filter ---
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  sortBy: 'franchise', // 'franchise' | 'releaseDate' | 'name' | 'price'
  setSortBy: (sort) => set({ sortBy: sort }),

  filterReleaseType: 'all',
  setFilterReleaseType: (type) => set({ filterReleaseType: type }),

  filterArc: 'all',
  setFilterArc: (arc) => set({ filterArc: arc }),

  filterBodySpec: 'all',
  setFilterBodySpec: (spec) => set({ filterBodySpec: spec }),

  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),

  // Get filtered + sorted figures
  getFilteredFigures: () => {
    const state = get();
    let results = [...state.figures];

    // Filter by franchise
    if (state.activeFranchise) {
      results = results.filter(f => f.franchise === state.activeFranchise);
    }

    // Search
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      results = results.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.line.toLowerCase().includes(q) ||
        f.arc.toLowerCase().includes(q)
      );
    }

    // Filters
    if (state.filterReleaseType !== 'all') {
      results = results.filter(f => f.releaseType === state.filterReleaseType);
    }
    if (state.filterArc !== 'all') {
      results = results.filter(f => f.arc === state.filterArc);
    }
    if (state.filterBodySpec !== 'all') {
      results = results.filter(f => f.bodySpec === state.filterBodySpec);
    }
    if (state.filterStatus !== 'all') {
      results = results.filter(f => f.status === state.filterStatus);
    }

    // Sort
    switch (state.sortBy) {
      case 'releaseDate':
        results.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        results.sort((a, b) => b.msrpUsd - a.msrpUsd);
        break;
      default: // franchise
        results.sort((a, b) => a.line.localeCompare(b.line) || a.name.localeCompare(b.name));
    }

    return results;
  },

  // Get unique values for filters
  getUniqueArcs: () => {
    const state = get();
    const arcs = [...new Set(state.figures.map(f => f.arc))];
    return arcs.sort();
  },

  getUniqueFranchises: () => {
    const state = get();
    const franchises = [...new Set(state.figures.map(f => f.franchise))];
    return franchises.sort();
  },

  // --- User Collection ---
  collection: [], // Array of { figureId, condition, boxCondition, hasShipperBox, purchasePrice, currency, dateAcquired, notes, badge }
  collectionLoaded: false,

  initCollection: async () => {
    const items = await loadCollection();
    set({ collection: items, collectionLoaded: true });
  },

  addToCollection: async (entry) => {
    const item = {
      figureId: entry.figureId,
      condition: entry.condition || 'misb',
      boxCondition: entry.boxCondition || 'mint',
      hasShipperBox: entry.hasShipperBox || false,
      purchasePrice: entry.purchasePrice || 0,
      currency: entry.currency || 'USD',
      dateAcquired: entry.dateAcquired || new Date().toISOString().split('T')[0],
      notes: entry.notes || '',
      badge: entry.badge || 'owned',
      quantity: entry.quantity || 1,
      displayStatus: entry.displayStatus || 'display', // 'display' | 'storage' | 'for_sale'
      storageLocation: entry.storageLocation || '',
      addedAt: Date.now(),
    };
    await saveCollectionItem(item);
    set((state) => ({
      collection: [...state.collection.filter(c => c.figureId !== item.figureId), item],
    }));
  },

  removeFromCollection: async (figureId) => {
    await removeCollectionItem(figureId);
    set((state) => ({
      collection: state.collection.filter(c => c.figureId !== figureId),
    }));
  },

  updateCollectionItem: async (figureId, updates) => {
    const state = get();
    const existing = state.collection.find(c => c.figureId === figureId);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await saveCollectionItem(updated);
    set((state) => ({
      collection: state.collection.map(c => c.figureId === figureId ? updated : c),
    }));
  },

  isInCollection: (figureId) => {
    return get().collection.some(c => c.figureId === figureId);
  },

  getCollectionEntry: (figureId) => {
    return get().collection.find(c => c.figureId === figureId);
  },

  getCollectionCount: () => get().collection.length,

  getCollectionValue: () => {
    const state = get();
    let total = 0;
    state.collection.forEach(entry => {
      const figure = state.figures.find(f => f.id === entry.figureId);
      if (figure) {
        total += (figure.msrpUsd || 0) * (entry.quantity || 1);
      }
    });
    return total;
  },

  // --- Badge helpers ---
  getBadge: (figureId) => {
    const entry = get().collection.find(c => c.figureId === figureId);
    return entry?.badge || null;
  },

  getGrailCount: () => get().collection.filter(c => c.badge === 'grail').length,
  getQuestCount: () => get().collection.filter(c => c.badge === 'quest').length,

  // --- Series Completion ---
  getSeriesCompletion: (seriesId) => {
    const state = get();
    const series = state.seriesDefinitions.find(s => s.id === seriesId);
    if (!series) return { owned: 0, total: 0, percentage: 0, missing: [] };

    const ownedIds = state.collection.map(c => c.figureId);
    const owned = series.requiredFigureIds.filter(id => ownedIds.includes(id));
    const missing = series.requiredFigureIds.filter(id => !ownedIds.includes(id));

    return {
      owned: owned.length,
      total: series.requiredFigureIds.length,
      percentage: Math.round((owned.length / series.requiredFigureIds.length) * 100),
      missing,
      missingFigures: missing.map(id => state.figures.find(f => f.id === id)).filter(Boolean),
    };
  },

  // --- Wishlist ---
  getWishlist: () => {
    return get().collection.filter(c => c.badge === 'quest' || c.badge === 'grail');
  },

  getWishlistValue: () => {
    const state = get();
    let total = 0;
    state.collection
      .filter(c => c.badge === 'quest' || c.badge === 'grail')
      .forEach(entry => {
        const figure = state.figures.find(f => f.id === entry.figureId);
        if (figure) total += figure.msrpUsd || 0;
      });
    return total;
  },

  // --- Notification (shared) ---
  notification: null,
  showNotification: (message, type = 'info') => {
    const id = Date.now();
    set({ notification: { message, type, id } });
    setTimeout(() => {
      set((state) => {
        if (state.notification?.id === id) return { notification: null };
        return {};
      });
    }, 3000);
  },
}));

export default useVaultStore;
