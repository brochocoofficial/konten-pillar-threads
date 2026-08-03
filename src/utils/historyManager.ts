import { HistoryItem, GenerateFormInput, GenerationResult } from '../types';

const HISTORY_STORAGE_KEY = 'pillarflow_history_v1';

export const getHistoryList = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load history from localStorage:', err);
    return [];
  }
};

export const saveToHistory = (
  input: GenerateFormInput,
  result: GenerationResult
): HistoryItem => {
  const existing = getHistoryList();
  
  const newItem: HistoryItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    productName: result.productName || input.productName,
    category: result.category || input.category,
    platform: result.platform || input.platform,
    input,
    result,
  };

  // Prepend new item and limit max 30 items
  const updated = [newItem, ...existing.filter(item => item.id !== newItem.id)].slice(0, 30);
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save item to history localStorage:', err);
  }

  return newItem;
};

export const deleteFromHistory = (id: string): HistoryItem[] => {
  const existing = getHistoryList();
  const updated = existing.filter(item => item.id !== id);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete item from history localStorage:', err);
  }
  return updated;
};

export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history localStorage:', err);
  }
};
