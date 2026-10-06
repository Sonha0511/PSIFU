const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
let memoryToken=null;
export async function setAccessToken(token){memoryToken=token||null;}
export async function getAccessToken(){return memoryToken;}
export async function clearAccessToken(){return setAccessToken(null);}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Free Render instances can sleep after inactivity. Network/5xx retries let the
// first app request wait for the service to wake instead of failing immediately.
export async function request(path, options = {}) {
  const maxAttempts = 3;
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
    await wait((attempt + 1) * 2500);
  }
  throw Object.assign(new Error('Máy chủ đang khởi động hoặc chưa thể kết nối. Vui lòng thử lại sau ít phút.'), { cause: lastError });
}
