const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  throw new Error('VITE_API_BASE_URL is not set. Configure the deployed backend Load Balancer URL in the frontend environment.');
};

const API_BASE_URL = resolveApiBaseUrl();

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(typeof data === 'string' ? data : data.detail || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect to backend at ${url}: ${error.message}`);
    }
    throw new Error(`Failed to connect to backend at ${url}`);
  }
}

export async function healthCheck() {
  try {
    return await request('/');
  } catch (error) {
    return request('/testing/health');
  }
}

export async function uploadAnalyticsFile(file) {
  const formData = new FormData();
  formData.append('excel_file', file);

  return request('/aircraft/analytics', {
    method: 'POST',
    body: formData,
  });
}

export async function getMaintenanceRecommendation(analyticsPayload) {
  return request('/aircraft/maintenance-prediction', {
    method: 'POST',
    body: JSON.stringify(analyticsPayload),
  });
}