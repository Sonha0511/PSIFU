import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY='@psifu_access_token';
let memoryToken=null;
export async function setAccessToken(token){memoryToken=token||null;if(token)await AsyncStorage.setItem(TOKEN_KEY,token);else await AsyncStorage.removeItem(TOKEN_KEY);}
export async function getAccessToken(){if(memoryToken)return memoryToken;memoryToken=await AsyncStorage.getItem(TOKEN_KEY);return memoryToken;}
export async function clearAccessToken(){return setAccessToken(null);}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Free Render instances can sleep after inactivity. Network/5xx retries let the
// first app request wait for the service to wake instead of failing immediately.
export async function request(path, options = {}) {
  // Render Free can need close to a minute to wake after inactivity.
  // Keep the user on the existing loading state instead of failing after a few seconds.
  const maxAttempts = 8;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const token=await getAccessToken(); const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers || {}) }, ...options });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : {};
      if (response.ok) return data;
      const error = Object.assign(new Error(data.msg || 'Không thể kết nối máy chủ.'), { data, status: response.status });
      if (response.status < 500 || attempt === maxAttempts - 1) throw error;
      lastError = error;
    } catch (error) {
      // Do not retry valid client responses such as an invalid password or an
      // already-used email address. Retry only connection/server wake-up issues.
      if (error.status && error.status < 500) throw error;
      lastError = error;
      if (attempt === maxAttempts - 1) break;
    }
    await wait(5000);
  }
  throw Object.assign(new Error('Máy chủ chưa phản hồi sau khoảng một phút. Vui lòng kiểm tra mạng rồi thử lại.'), { cause: lastError });
}
