import { HistoryItem, GenerateFormInput, GenerationResult } from '../types';

const getStorageKey = (userId?: string) => {
  if (!userId) return 'pillarflow_history_v1_guest';
  return `pillarflow_history_v1_${userId}`;
};

export const getHistoryList = (userId?: string): HistoryItem[] => {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);

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
  result: GenerationResult,
  userId?: string
): HistoryItem => {
  const existing = getHistoryList(userId);
  
  const newItem: HistoryItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
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
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save item to history localStorage:', err);
  }

  return newItem;
};

export const deleteFromHistory = (id: string, userId?: string): HistoryItem[] => {
  const existing = getHistoryList(userId);
  const updated = existing.filter(item => item.id !== id);
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete item from history localStorage:', err);
  }
  return updated;
};

export const clearAllHistory = (userId?: string): void => {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear history localStorage:', err);
  }
};
