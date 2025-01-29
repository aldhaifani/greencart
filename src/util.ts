// Description: This file contains utility functions that are used across the extension.

// Helper function to set value in storage
export function setStorage<V = any>(key: string, value: V) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(true);
      }
    });
  });
}

// Helper function to get value from storage
export function getStorage<V = any>(key: string): Promise<V | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export function sanitizeLink(url: string) {
  try {
    const sanitized = new URL(url);
    return sanitized.toString();
  } catch (e) {
    return "#";
  }
};
