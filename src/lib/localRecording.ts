import type { RecordingHandle } from "./captureEngine";

export async function startMicrophone(signal: AbortSignal): Promise<RecordingHandle> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Microphone capture unsupported");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  if (signal.aborted) { stream.getTracks().forEach(track => track.stop()); throw new Error("Capture cancelled"); }
  let recorder: MediaRecorder;
  const chunks: Blob[] = [];
  let failed = false;
  const release = () => stream.getTracks().forEach(track => track.stop());
  try {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { failed = true; release(); };
    recorder.start(1000);
  } catch (error) { release(); throw error; }
  return {
    isActive: () => !failed && recorder.state === "recording",
    abort() { if (recorder.state !== "inactive") recorder.stop(); release(); },
    stop() {
      return new Promise<Blob | null>((resolve, reject) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true; clearTimeout(timeout); release();
          if (failed) reject(new Error("Recording failed"));
          else resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || chunks[0].type }) : null);
        };
        const timeout = setTimeout(() => { failed = true; finish(); }, 5000);
        if (recorder.state === "inactive") finish();
        else { recorder.onstop = finish; recorder.stop(); }
      });
    },
  };
}

function audioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fathom-local-audio", 1);
    request.onblocked = () => reject(new Error("Local audio database is blocked"));
    request.onupgradeneeded = () => request.result.createObjectStore("recordings");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveRecording(id: string, blob: Blob): Promise<void> {
  const db = await audioDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function readRecording(id: string): Promise<Blob | null> {
  const db = await audioDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction("recordings").objectStore("recordings").get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
