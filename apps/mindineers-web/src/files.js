const DB = "mindineers-files-v1";
function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function saveFile(file, id) {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a file smaller than 25 MB.");
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function downloadFile(id, name) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly"),
      r = tx.objectStore("files").get(id);
    r.onsuccess = () => {
      db.close();
      if (!r.result) {
        reject(new Error("The original file is not stored in this browser."));
        return;
      }
      const url = URL.createObjectURL(r.result);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    };
    r.onerror = () => {
      db.close();
      reject(r.error);
    };
  });
}
export async function getFile(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly"),
      r = tx.objectStore("files").get(id);
    r.onsuccess = () => {
      db.close();
      r.result
        ? resolve(r.result)
        : reject(
            new Error(
              "Original file unavailable on this device. Restore the original file to preview it.",
            ),
          );
    };
    r.onerror = () => {
      db.close();
      reject(r.error);
    };
  });
}
