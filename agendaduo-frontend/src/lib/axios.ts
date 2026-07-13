import axios from 'axios';

// Instância do Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  let clinicaId = '';
  
  if (typeof window !== 'undefined') {
    clinicaId = localStorage.getItem('agendaduo_clinica_id') || '';
  }
  
  if (clinicaId) {
    config.headers['x-clinica-id'] = clinicaId;
  }
  return config;
});

export default api;
