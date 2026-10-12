import { http } from './httpClient.js';

export const catalogApi = { get: () => http.get('/catalog') };
