const BASE_URL = import.meta.env.VITE_API_URL 
// const BASE_URL = 'http://localhost:8000'

const request = async (method: string, path: string, body?: any) => {
  const token = localStorage.getItem('calories_tracker_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  
  return res.json()
}

const get = async (path: string) => await request('GET', path)
const post = async (path: string, body: any) => await request('POST', path, body)
const put = async (path: string, body: any) => await request('PUT', path, body)
const del = async (path: string) => await request('DELETE', path)

export { get, post, put, del }
