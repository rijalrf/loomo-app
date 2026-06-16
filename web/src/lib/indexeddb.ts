export function getVideoFromIndexedDB(id: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const request = indexedDB.open('JamDevCloneDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      
      // Ensure the object store exists before trying to read
      if (!db.objectStoreNames.contains('videos')) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction('videos', 'readonly');
      const store = transaction.objectStore('videos');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

export function deleteVideoFromIndexedDB(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const request = indexedDB.open('JamDevCloneDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('videos')) {
        resolve();
        return;
      }
      
      const transaction = db.transaction('videos', 'readwrite');
      const store = transaction.objectStore('videos');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
