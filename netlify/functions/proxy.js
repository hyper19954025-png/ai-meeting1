exports.handler = async function (event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  try {
    const input = JSON.parse(event.body || '{}');
    const target = String(input.url || '').trim();
    if (!/^https:\/\//i.test(target)) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Only HTTPS target URLs are allowed' }) };
    const outgoingHeaders = { 'Content-Type': 'application/json' };
    const incoming = input.headers && typeof input.headers === 'object' ? input.headers : {};
    for (const [key, value] of Object.entries(incoming)) {
      if (/^(authorization|content-type|accept)$/i.test(key) && typeof value === 'string') outgoingHeaders[key] = value.replace(/[\r\n]/g, '');
    }
    const upstream = await fetch(target, {
      method: 'POST',
      headers: outgoingHeaders,
      body: JSON.stringify(input.body || {})
    });
    const text = await upstream.text();
    return { statusCode: upstream.status, headers: cors, body: text || JSON.stringify({ error: upstream.statusText }) };
  } catch (error) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: `Proxy request failed: ${error.message}` }) };
  }
};
