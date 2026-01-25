import { openDB } from 'idb';

const DB_NAME = 'school-portal-offline';
const DB_VERSION = 2;

const stores = {
  STUDENTS: 'students',
  STAFF: 'staff',
  SUBJECTS: 'subjects',
  USERS: 'users',
  RESULTS: 'results',
  PENDING_RESULTS: 'pendingResults',
  CERTIFICATION_RESULTS: 'certificationResults',
  FEES: 'feeRecords',
  TIMETABLE: 'timetableEntries',
  CALENDAR: 'calendarEvents',
  LIBRARY: 'digitalLibrary',
  ATTENDANCE: 'attendanceRecords',
  MESSAGES: 'adminMessages',
  SYNC_QUEUE: 'syncQueue',
  LOCAL_CHANGES: 'localChanges'
};

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading IndexedDB from ${oldVersion} to ${newVersion}`);
      
      // Create all stores if they don't exist
      Object.values(stores).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          console.log(`Creating store: ${storeName}`);
          const store = db.createObjectStore(storeName, { 
            keyPath: 'id'
          });
          
          // Add indexes for efficient querying
          if (storeName === stores.STUDENTS) {
            store.createIndex('admissionNo', 'admissionNo', { unique: true });
            store.createIndex('studentClass', 'studentClass');
            store.createIndex('username', 'username');
          }
          if (storeName === stores.STAFF) {
            store.createIndex('staffId', 'staffId', { unique: true });
            store.createIndex('role', 'role');
            store.createIndex('username', 'username');
          }
          if (storeName === stores.SUBJECTS) {
            store.createIndex('subjectCode', 'subjectCode', { unique: true });
          }
          if (storeName === stores.USERS) {
            store.createIndex('username', 'username', { unique: true });
          }
          if (storeName === stores.RESULTS) {
            store.createIndex('studentNameSelect', 'studentNameSelect');
            store.createIndex('classSelect', 'classSelect');
            store.createIndex('subjectSelect', 'subjectSelect');
          }
          if (storeName === stores.ATTENDANCE) {
            store.createIndex('date', 'date');
            store.createIndex('studentId', 'studentId');
            store.createIndex('class', 'class');
          }
          if (storeName === stores.SYNC_QUEUE) {
            store.createIndex('status', 'status');
            store.createIndex('entityName', 'entityName');
          }
        }
      });
    }
  });
};

export const offlineDB = {
  async getAll(storeName) {
    try {
      const db = await initDB();
      const result = await db.getAll(storeName);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Error getting all from ${storeName}:`, error);
      return [];
    }
  },

  async getById(storeName, id) {
    try {
      const db = await initDB();
      return await db.get(storeName, id);
    } catch (error) {
      console.error(`Error getting by id from ${storeName}:`, error);
      return null;
    }
  },

  async getByIndex(storeName, indexName, value) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      return await index.getAll(value);
    } catch (error) {
      console.error(`Error getting by index from ${storeName}:`, error);
      return [];
    }
  },

  async put(storeName, item) {
    try {
      const db = await initDB();
      return await db.put(storeName, item);
    } catch (error) {
      console.error(`Error putting item in ${storeName}:`, error);
      throw error;
    }
  },

  async add(storeName, item) {
    try {
      const db = await initDB();
      return await db.add(storeName, item);
    } catch (error) {
      console.error(`Error adding item to ${storeName}:`, error);
      throw error;
    }
  },

  async delete(storeName, id) {
    try {
      const db = await initDB();
      return await db.delete(storeName, id);
    } catch (error) {
      console.error(`Error deleting from ${storeName}:`, error);
      throw error;
    }
  },

  async clear(storeName) {
    try {
      const db = await initDB();
      return await db.clear(storeName);
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
      throw error;
    }
  },

  async addToSyncQueue(operation) {
    try {
      const db = await initDB();
      const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const queueItem = {
        id,
        ...operation,
        timestamp: new Date().toISOString(),
        status: 'pending',
        attempts: 0
      };
      return await db.add(stores.SYNC_QUEUE, queueItem);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  },

  async getSyncQueue() {
    try {
      const db = await initDB();
      return await db.getAll(stores.SYNC_QUEUE);
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  },

  async removeFromQueue(id) {
    try {
      const db = await initDB();
      return await db.delete(stores.SYNC_QUEUE, id);
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  },

  async updateQueueItem(id, updates) {
    try {
      const db = await initDB();
      const tx = db.transaction(stores.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(stores.SYNC_QUEUE);
      const item = await store.get(id);
      if (item) {
        const updatedItem = { ...item, ...updates };
        await store.put(updatedItem);
        return updatedItem;
      }
      return null;
    } catch (error) {
      console.error('Error updating queue item:', error);
      throw error;
    }
  }
};

export const entityStoreMap = {
  'schoolPortalStudents': stores.STUDENTS,
  'schoolPortalStaff': stores.STAFF,
  'schoolPortalSubjects': stores.SUBJECTS,
  'schoolPortalUsers': stores.USERS,
  'schoolPortalResults': stores.RESULTS,
  'schoolPortalPendingResults': stores.PENDING_RESULTS,
  'schoolPortalCertificationResults': stores.CERTIFICATION_RESULTS,
  'schoolPortalFeeRecords': stores.FEES,
  'schoolPortalTimetables': stores.TIMETABLE,
  'schoolPortalCalendarEvents': stores.CALENDAR,
  'schoolPortalDigitalLibrary': stores.LIBRARY,
  'schoolPortalAttendance': stores.ATTENDANCE,
  'schoolPortalAdminMessages': stores.MESSAGES
};