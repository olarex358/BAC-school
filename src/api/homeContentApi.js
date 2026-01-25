// src/api/homeContentApi.js
import { offlineApi } from './offlineApi';

export const homeContentApi = {
  saveHeroImage(data) {
    return offlineApi.post('/home/hero', data);
  },

  saveNews(data) {
    return offlineApi.post('/home/news', data);
  },

  saveEvent(data) {
    return offlineApi.post('/home/events', data);
  },

  deleteItem(type, id) {
    return offlineApi.delete(`/home/${type}/${id}`);
  }
};
