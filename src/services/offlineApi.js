// src/services/offlineApi.js
import { offlineDB, entityStoreMap } from "../utils/offlineDB";

const BASE_URL =
  (process.env.REACT_APP_API_URL || "https://school-portal-backend-i29s.onrender.com") + "/api";

class OfflineApiService {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;

    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingOperations(); // ✅ ONLY HERE
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  getToken() {
    return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  }

  getAuthHeaders(extra = {}) {
    const token = this.getToken();
    const headers = { "Content-Type": "application/json", ...extra };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  cleanForServer(data) {
    const payload = { ...(data || {}) };
    // remove local-only fields
    delete payload._local;
    delete payload.createdAt;
    delete payload.updatedAt;

    // IMPORTANT: do not send local_* ids to Mongo
    if (typeof payload._id === "string" && payload._id.startsWith("local_")) delete payload._id;
    if (typeof payload.id === "string" && payload.id.startsWith("local_")) delete payload.id;

    return payload;
  }

  // ---------- READ (local-first) ----------
  async get(entityName, id = null) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return id ? null : [];

    if (id) {
      const item = await offlineDB.getById(storeName, id);
      return item ? { ...item, _id: item._id || item.id } : null;
    }

    const items = await offlineDB.getAll(storeName);
    return (items || []).map((item) => ({ ...item, _id: item._id || item.id }));
  }

  // ---------- CREATE ----------
  async create(entityName, data) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return null;

    // Always keep a local copy
    const localId = `local_${Date.now()}`;
    const record = {
      ...data,
      _id: localId,
      id: localId,
      _local: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await offlineDB.put(storeName, record);

    // If online, send immediately (backend is primary)
    if (this.isOnline && this.getToken()) {
      try {
        const res = await fetch(`${this.baseUrl}/${entityName}`, {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(this.cleanForServer(record)),
        });

        // If backend rejects, queue it
        if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      } catch {
        await offlineDB.addToSyncQueue({ type: "POST", entityName, data: record });
      }
    } else {
      // Offline => queue only
      await offlineDB.addToSyncQueue({ type: "POST", entityName, data: record });
    }

    return record;
  }

  // ---------- UPDATE ----------
  async update(entityName, id, data) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return null;

    const updated = { ...data, _id: id, id, updatedAt: Date.now() };
    await offlineDB.put(storeName, updated);

    if (this.isOnline && this.getToken() && !String(id).startsWith("local_")) {
      try {
        const res = await fetch(`${this.baseUrl}/${entityName}/${id}`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(this.cleanForServer(updated)),
        });
        if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
      } catch {
        await offlineDB.addToSyncQueue({ type: "PUT", entityName, recordId: id, data: updated });
      }
    } else {
      await offlineDB.addToSyncQueue({ type: "PUT", entityName, recordId: id, data: updated });
    }

    return updated;
  }

  // ---------- DELETE ----------
  async remove(entityName, id) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return false;

    await offlineDB.delete(storeName, id);

    if (this.isOnline && this.getToken() && !String(id).startsWith("local_")) {
      try {
        const res = await fetch(`${this.baseUrl}/${entityName}/${id}`, {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
      } catch {
        await offlineDB.addToSyncQueue({ type: "DELETE", entityName, recordId: id });
      }
    } else {
      await offlineDB.addToSyncQueue({ type: "DELETE", entityName, recordId: id });
    }

    return true;
  }

  // ---------- SYNC (ONLY on online event) ----------
  async syncPendingOperations() {
    if (!this.isOnline || this.syncInProgress) return;
    const token = this.getToken();
    if (!token) return;

    this.syncInProgress = true;

    try {
      const queue = await offlineDB.getSyncQueue();

      for (const job of queue) {
        try {
          const id = job.recordId || job.data?._id;

          // don't attempt PUT/DELETE for local-only ids
          if ((job.type === "PUT" || job.type === "DELETE") && String(id).startsWith("local_")) {
            await offlineDB.removeFromQueue(job.id);
            continue;
          }

          const url =
            job.type === "POST"
              ? `${this.baseUrl}/${job.entityName}`
              : `${this.baseUrl}/${job.entityName}/${id}`;

          const options =
            job.type === "DELETE"
              ? { method: "DELETE", headers: this.getAuthHeaders() }
              : {
                  method: job.type,
                  headers: this.getAuthHeaders(),
                  body: JSON.stringify(this.cleanForServer(job.data)),
                };

          const res = await fetch(url, options);

          // stop syncing if auth fails
          if (res.status === 401) break;

          // remove permanently on bad payload/duplicate
          if (res.status === 400 || res.status === 409) {
            await offlineDB.removeFromQueue(job.id);
            continue;
          }

          if (!res.ok) continue;

          await offlineDB.removeFromQueue(job.id);
        } catch {
          // keep queued
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async getSyncStatus() {
    const queue = await offlineDB.getSyncQueue();
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      total: queue.length,
      pending: queue.filter((q) => q.status === "pending").length,
      items: queue,
    };
  }
}

export const offlineApi = new OfflineApiService();
export default offlineApi;
