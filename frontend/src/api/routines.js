import api from './axios';

export const getRoutine = (batch) => api.get(`/routines`, { params: { batch } });
export const updateRoutine = (batch, schedule) => api.put(`/routines/${batch}`, { schedule });
