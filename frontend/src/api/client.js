import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Dashboard
export const fetchMetrics = () => client.get('/dashboard/metrics');
export const fetchActivityFeed = (limit = 20) => client.get(`/activity/feed?limit=${limit}`);

// Users
export const fetchUsers = () => client.get('/users');
export const fetchUser = (id) => client.get(`/users/${id}`);
export const createUser = (data) => client.post('/users/create', data);

// Referrals
export const fetchReferrals = () => client.get('/referrals');
export const claimReferral = (data) => client.post('/referral/claim', data);

// Graph
export const fetchUserGraph = (userId, depth = 3) => client.get(`/user/${userId}/graph?depth=${depth}`);

// Rewards
export const fetchUserRewards = (userId) => client.get(`/user/${userId}/rewards`);

// Fraud
export const fetchFraudFlags = () => client.get('/fraud/flags');

// Simulation
export const triggerSimulation = (count = 100) => client.post(`/simulate/generate?count=${count}`);

// New Feature APIs
export const exportUsers = () => client.get('/users/export', { responseType: 'blob' });
export const blockUser = (userId) => client.post(`/users/${userId}/block`);
export const fetchPendingRewards = () => client.get('/rewards/pending');
export const processBatchRewards = () => client.post('/rewards/process-batch');
export const payoutReward = (txId) => client.post(`/rewards/${txId}/payout`);
export const rejectReward = (txId) => client.post(`/rewards/${txId}/reject`);
export const dismissFraudLog = (logId) => client.post(`/fraud/${logId}/dismiss`);
export const reviewFraudLog = (logId) => client.post(`/fraud/${logId}/review`);
export const exportDashboardReport = () => client.get('/dashboard/export-report', { responseType: 'blob' });
export const fetchLogDetails = (eventId) => client.get(`/logs/${eventId}`);

// Auth & Access Control
export const loginUser = (data) => client.post('/auth/login', data, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
export const registerUser = (data) => client.post('/auth/register', data);
export const verifyReferral = (code) => client.get(`/auth/verify-referral/${code}`);
export const fetchMe = () => client.get('/user/me');
export const fetchMeGraph = () => client.get('/user/me/graph');

export default client;
