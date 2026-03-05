const BASE_URL = '/api/invoicing/v1';

const getApiKey = () => {
  const key = import.meta.env.VITE_HOLDED_API_KEY;
  if (!key) throw new Error('VITE_HOLDED_API_KEY no está configurada en .env');
  return key;
};

const fetchHolded = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      key: getApiKey(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Holded API error ${res.status}: ${text}`);
  }
  return res.json();
};

// Contacts
export const getContacts = () => fetchHolded('/contacts');
export const getContact = (id) => fetchHolded(`/contacts/${id}`);

// Documents
export const getDocuments = (docType, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const qs = query ? `?${query}` : '';
  return fetchHolded(`/documents/${docType}${qs}`);
};
export const getDocument = (docType, id) => fetchHolded(`/documents/${docType}/${id}`);

// Document PDF - returns base64 encoded PDF
export const getDocumentPdf = async (docType, id) => {
  const data = await fetchHolded(`/documents/${docType}/${id}/pdf`);
  return data.data; // base64 string
};

// Products
export const getProducts = () => fetchHolded('/products');
export const getProduct = (id) => fetchHolded(`/products/${id}`);

// Services
export const getServices = () => fetchHolded('/services');

// Treasury
export const getTreasury = () => fetchHolded('/treasury');

// Payments
export const getPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const qs = query ? `?${query}` : '';
  return fetchHolded(`/payments${qs}`);
};

// Expenses accounts
export const getExpensesAccounts = () => fetchHolded('/expensesaccounts');

// Taxes
export const getTaxes = () => fetchHolded('/taxes');

// Warehouses
export const getWarehouses = () => fetchHolded('/warehouses');

// Sales channels
export const getSalesChannels = () => fetchHolded('/saleschannels');
