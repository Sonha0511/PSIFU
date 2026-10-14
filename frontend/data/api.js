import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY='psifu_access_token';
const LEGACY_TOKEN_KEY='@psifu_access_token';
let memoryToken=null;
const tokenStore = Platform.OS === 'web' ? {
  getItemAsync: key => AsyncStorage.getItem(key),
  setItemAsync: (key,value) => AsyncStorage.setItem(key,value),
  deleteItemAsync: key => AsyncStorage.removeItem(key),
} : SecureStore;
export async function setAccessToken(token) {
  if(token)await tokenStore.setItemAsync(TOKEN_KEY,token);
  else await tokenStore.deleteItemAsync(TOKEN_KEY);
  memoryToken=token||null;
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}
export async function getAccessToken() {
  if(memoryToken)return memoryToken;
  memoryToken=await tokenStore.getItemAsync(TOKEN_KEY);
  if(memoryToken)return memoryToken;
  const legacyToken=await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if(legacyToken){await setAccessToken(legacyToken);return legacyToken;}
  return null;
}
export async function clearAccessToken(){return setAccessToken(null);}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Cold-start retries are safe for reads, not unconfirmed mutations.
export async function request(path, options = {}) {
  const { timeoutMs = 25000, signal: callerSignal, ...fetchOptions } = options;
  const maxAttempts = (fetchOptions.method || 'GET').toUpperCase() === 'GET' ? 2 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (callerSignal?.aborted) controller.abort();
    callerSignal?.addEventListener('abort', abort);
    const timer = setTimeout(abort, timeoutMs);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(fetchOptions.headers || {}) },
        signal: controller.signal,
      });
      const data = (response.headers.get('content-type') || '').includes('application/json') ? await response.json() : {};
      if (response.ok) return data;
      throw Object.assign(new Error(data.msg || 'Máy chủ chưa xử lý được yêu cầu.'), {data, status:response.status});
    } catch (error) {
      if (callerSignal?.aborted || (error.status && error.status < 500) || attempt === maxAttempts - 1) {
        if (error.name === 'AbortError') throw new Error('Yêu cầu quá thời gian chờ. Nếu đang thanh toán/đặt lịch, hãy kiểm tra trạng thái trước khi thử lại.');
        throw error;
      }
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', abort);
    }
    await wait(1500);
  }
}
