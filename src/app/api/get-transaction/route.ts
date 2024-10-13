// Need a single client?:
import { createClient } from '@vercel/postgres';

export async function POST(request: Request) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();

    const { hash, chainId } = await request.json();

    const res = await client.query(`SELECT * FROM transactions WHERE hash = '${hash}' AND chainid = '${chainId}'`);

    const data = res.rows;

    if (!data.length) return Response.error();

    return Response.json({
      hash,
      chainId,
      adapters: JSON.parse(data[0].adapters),
    });
  } catch (err) {
    console.log(err);
    return Response.error();
  } finally {
    await client.end();
  }
}
