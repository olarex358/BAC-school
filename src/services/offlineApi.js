import { offlineDB, entityStoreMap } from "../utils/offlineDB";

class OfflineApiService {
  constructor(baseUrl = "http://localhost:5000/api") {
    this.baseUrl = baseUrl;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;

    this.setupNetworkListeners();
  }

  /* ================= NETWORK ================= */
  setupNetworkListeners() {
    window.addEventListener("online", () => {
      console.log("🌐 Network: Online");
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Network: Offline");
      this.isOnline = false;
    });
  }

  /* ================= AUTH ================= */
  getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    const adminToken = localStorage.getItem("adminToken") || "";

    return {
      "Content-Type": "application/json",
      Authorization: token
        ? `Bearer ${token}`
        : adminToken
        ? `Bearer ${adminToken}`
        : "",
    };
  }

  /* ================= GET ================= */
  async get(entityName, id = null) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return id ? null : [];

    if (id) {
      const item = await offlineDB.getById(storeName, id);
      if (!item) return null;

      return {
        ...item,
        _id: item._id || item.id,
      };
    }

    const items = await offlineDB.getAll(storeName);
    return items.map(item => ({
      ...item,
      _id: item._id || item.id,
    }));
  }

  /* ================= CREATE (POST) ================= */
  async post(entityName, data) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return null;

    const localId = "local_" + Date.now();

    const record = {
      ...data,
      _id: localId,        // ✅ primary ID
      id: localId,         // ⚠️ fallback (legacy safety)
      _local: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await offlineDB.put(storeName, record);

    await offlineDB.addToSyncQueue({
      type: "POST",
      entityName,
      id: localId,
      data: record,
      status: "pending",
    });

    this.triggerSync();
    return record;
  }

  /* ================= UPDATE (PUT) ================= */
  async put(entityName, id, data) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return null;

    const updated = {
      ...data,
      _id: id,        // ✅ primary ID
      id,             // ⚠️ fallback
      updatedAt: Date.now(),
    };

    await offlineDB.put(storeName, updated);

    await offlineDB.addToSyncQueue({
      type: "PUT",
      entityName,
      id,
      data: updated,
      status: "pending",
    });

    this.triggerSync();
    return updated;
  }

  /* ================= DELETE ================= */
  async delete(entityName, id) {
    const storeName = entityStoreMap[entityName];
    if (!storeName) return false;

    await offlineDB.delete(storeName, id);

    await offlineDB.addToSyncQueue({
      type: "DELETE",
      entityName,
      id,
      status: "pending",
    });

    this.triggerSync();
    return true;
  }

  /* ================= SYNC ENGINE ================= */
  async syncPendingOperations() {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    const queue = await offlineDB.getSyncQueue();

    for (const job of queue) {
      try {
        const recordId = job.data?._id || job.id;

        const url =
          job.type === "POST"
            ? `${this.baseUrl}/${job.entityName}`
            : `${this.baseUrl}/${job.entityName}/${recordId}`;

        await fetch(url, {
          method: job.type,
          headers: this.getAuthHeaders(),
          body: job.type === "DELETE" ? null : JSON.stringify(job.data),
        });

        await offlineDB.removeFromQueue(job.id);
      } catch (err) {
        console.error("❌ Sync failed:", err);
      }
    }

    this.syncInProgress = false;
  }

  triggerSync() {
    if (this.isOnline) {
      setTimeout(() => this.syncPendingOperations(), 1000);
    }
  }

  /* ================= STATUS ================= */
  async getQueuedCount() {
    const queue = await offlineDB.getSyncQueue();
    return queue.length;
  }

  async getSyncStatus() {
    const queue = await offlineDB.getSyncQueue();
    return {
      total: queue.length,
      pending: queue.filter(q => q.status === "pending").length,
      items: queue,
    };
  }

  /* ================= ALIASES ================= */
  async create(entityName, data) {
    return this.post(entityName, data);
  }

  async update(entityName, id, data) {
    return this.put(entityName, id, data);
  }

  async remove(entityName, id) {
    return this.delete(entityName, id);
  }
}

/* ================= EXPORT ================= */
export const offlineApi = new OfflineApiService();
export default offlineApi;
