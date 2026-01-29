// src/utils/offlineDB.js
import { openDB } from "idb";

const DB_NAME = "BACSchoolPortalDB";
const DB_VERSION = 1;

export const stores = {
  STUDENTS: "students",
  STAFF: "staff",
  USERS: "users",
  SUBJECTS: "subjects",
  RESULTS: "results",
  PENDING_RESULTS: "pendingResults",
  FEE_RECORDS: "feeRecords",
  ATTENDANCE: "attendance",
  TIMETABLES: "timetables",
  DIGITAL_LIBRARY: "digitalLibrary",
  ADMIN_MESSAGES: "adminMessages",
  SYNC_QUEUE: "syncQueue",
};

export const entityStoreMap = {
  schoolPortalStudents: stores.STUDENTS,
  schoolPortalStaff: stores.STAFF,
  schoolPortalUsers: stores.USERS,
  schoolPortalSubjects: stores.SUBJECTS,
  schoolPortalResults: stores.RESULTS,
  schoolPortalPendingResults: stores.PENDING_RESULTS,
  schoolPortalFeeRecords: stores.FEE_RECORDS,
  schoolPortalAttendance: stores.ATTENDANCE,
  schoolPortalTimetables: stores.TIMETABLES,
  schoolPortalDigitalLibrary: stores.DIGITAL_LIBRARY,
  schoolPortalAdminMessages: stores.ADMIN_MESSAGES,
};

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Entity stores (keyPath id)
      const ensureStore = (name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      };

      ensureStore(stores.STUDENTS);
      ensureStore(stores.STAFF);
      ensureStore(stores.USERS);
      ensureStore(stores.SUBJECTS);
      ensureStore(stores.RESULTS);
      ensureStore(stores.PENDING_RESULTS);
      ensureStore(stores.FEE_RECORDS);
      ensureStore(stores.ATTENDANCE);
      ensureStore(stores.TIMETABLES);
      ensureStore(stores.DIGITAL_LIBRARY);
      ensureStore(stores.ADMIN_MESSAGES);

      // Sync queue (keyPath id)
      if (!db.objectStoreNames.contains(stores.SYNC_QUEUE)) {
        db.createObjectStore(stores.SYNC_QUEUE, { keyPath: "id" });
      }
    },
  });
}

export const offlineDB = {
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },

  async getById(storeName, id) {
    const db = await initDB();
    return db.get(storeName, id);
  },

  // ✅ put = insert OR update (prevents "Key already exists")
  async put(storeName, item) {
    const db = await initDB();
    return db.put(storeName, item);
  },

  async delete(storeName, id) {
    const db = await initDB();
    return db.delete(storeName, id);
  },

  async clear(storeName) {
    const db = await initDB();
    return db.clear(storeName);
  },

  // ✅ Queue IDs must be unique (never reuse entity record id here)
  async addToSyncQueue(operation) {
    const db = await initDB();
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const queueItem = {
      id,
      ...operation,
      timestamp: new Date().toISOString(),
      status: "pending",
      attempts: 0,
    };

    // ✅ Use PUT to avoid duplicate crash even if somehow same id repeats
    return db.put(stores.SYNC_QUEUE, queueItem);
  },

  async getSyncQueue() {
    const db = await initDB();
    return db.getAll(stores.SYNC_QUEUE);
  },

  async removeFromQueue(id) {
    const db = await initDB();
    return db.delete(stores.SYNC_QUEUE, id);
  },

  async updateQueueItem(id, updates) {
    const db = await initDB();
    const item = await db.get(stores.SYNC_QUEUE, id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates };
    await db.put(stores.SYNC_QUEUE, updatedItem);
    return updatedItem;
  },
};
