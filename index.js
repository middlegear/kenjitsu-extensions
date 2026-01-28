const url = 'https://kwik.cx/d/jdN0UAJ0HBE9';

const headers = {
  authority: 'kwik.cx',
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'max-age=0',
  'content-type': 'application/x-www-form-urlencoded',
  origin: 'https://kwik.cx',
  referer: 'https://kwik.cx/f/jdN0UAJ0HBE9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  // Note: Browsers usually block setting the 'Cookie' header manually for security.
  // This works in Node.js (with node-fetch) or environments where you control the headers.
  cookie:
    'kwik_session=eyJpdiI6IjNjMzI1Zmc1Q1VmUXZ3ZU54K2ZobVE9PSIsInZhbHVlIjoiYUdhcDlMdHhyRmFYMUoxU2hMY29jck9HcEp0dS9GRWNGODVmd0pWUkFsclVlSWg3UGF6dko1R0dxTjlyWXVaTmNwZ2Z4ZHhDZGVwUlBHSENHUFU4c1pwVDZEd0tuQndTUmpnK2ZWVk50cS9UR3o4SlgyMVM4V2ZGcm5HQ3IxeXgiLCJtYWMiOiI4Y2Y4NDM5MDk5MGI3OTFmY2MwYjUxZWZlZGFhYjM5YTBlYjI1MTIxM2UxZjE3MGY3YTQ1MGE0YWZjNGY5OTgwIiwidGFnIjoiIn0%3D; pp_show_on_4e5e04716f26fd21bf611637f4fb8a46=1; cf_clearance=T4K5MlZmNYhI_SQHDNMWVYhNyVE0v.qIstLM05hL_Y0-1769553611-1.2.1.1-d6.jSBqnatYc1_94OLpzQ3kS_C5ByIzXd.5GlcB0nwHta1wfEw9OxbyWyCk36DW3uIui2fUR5W52E17a2nRXFh9bfC8CSb0lVNc53gu6EL4UHeBefCJ0j5exXf0.TR3PwFEnvm.tYc4hyhY.vvlusbdQjs3Vt.evjz0MTm8Mjnz3q617XkvqvXXkoH3MiZ6oae7.ofSK8RC3nBVlxT3perRUxAjvhw19ilGciTCoTRE; sb_count_e1010ee4b61613b1b253d71d1c531c2e=4',
};

const body = new URLSearchParams();
body.append('_token', 'OmfWPxuUrG8A4EVpnShoisCnN3wVpS5pw7GgLIcO');

fetch(url, {
  method: 'POST',
  headers: headers,
  body: body,
  redirect: 'manual',
})
  .then(response => response.text())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
