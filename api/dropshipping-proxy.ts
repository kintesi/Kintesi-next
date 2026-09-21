export default async function handler(req: any, res: any) {
  const page = req.query.page || '1';
  const upstreamUrl = `https://mohasagor.com.bd/api/reseller/product?page=${page}`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'api-key': 'A8niclztH9JtzS4t',
        'secret-key': '2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8',
        'Accept': 'application/json',
      },
    });

    const data = await upstreamRes.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(upstreamRes.status).send(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Upstream request failed' });
  }
}
