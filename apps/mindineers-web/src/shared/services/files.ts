import { ServiceError } from "./errors";
const DB = "mindineers-files-v1";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let rejected = false;
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files"))
        request.result.createObjectStore("files");
    };
    request.onsuccess = () => {
      if (rejected) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(new ServiceError("storage"));
    request.onblocked = () => {
      rejected = true;
      reject(new ServiceError("storage"));
    };
  });
}
export async function saveFile(file: Blob, id: string): Promise<void> {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a file smaller than 25 MB.");
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new ServiceError("storage"));
      tx.onabort = () => reject(new ServiceError("storage"));
    });
  } finally {
    db.close();
  }
}
export async function getFile(id: string): Promise<Blob> {
  const db = await open();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const tx = db.transaction("files", "readonly"),
        request = tx.objectStore("files").get(id);
      request.onsuccess = () => {
        const result: unknown = request.result;
        if (result instanceof Blob) resolve(result);
        else reject(new ServiceError("not-found"));
      };
      request.onerror = () => reject(new ServiceError("storage"));
      tx.onabort = () => reject(new ServiceError("storage"));
    });
  } finally {
    db.close();
  }
}
export async function downloadFile(id: string, name: string): Promise<void> {
  const file = await getFile(id),
    url = URL.createObjectURL(file);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
