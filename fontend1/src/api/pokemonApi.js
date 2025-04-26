import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('API Error:', error.response.status, error.response.data);
      return Promise.reject({
        status: error.response.status,
        message: error.response.data.error || 'An error occurred',
        details: error.response.data.details
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
      return Promise.reject({
        status: 503,
        message: 'No response from server'
      });
    } else {
      // Something happened in setting up the request
      console.error('API Error:', error.message);
      return Promise.reject({
        status: 500,
        message: 'Request setup failed'
      });
    }
  }
);

export const capturePokemon = async (pokemonData) => {
  try {
    return await api.post('/pokemon', pokemonData);
  } catch (error) {
    console.error('Failed to capture Pokemon:', error);
    throw error;
  }
};

export const fetchAllPokemon = async () => {
  try {
    return await api.get('/pokemon');
  } catch (error) {
    console.error('Failed to fetch Pokemon:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    return await api.get('/health');
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};