import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Set Authorization token for future requests
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

export default API;
