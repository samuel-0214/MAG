// Need a single client?:
import { createClient } from '@vercel/postgres';

export async function POST(request: Request) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();

    const { hash, chainId, adapters } = await request.json();

    // add transaction to the database
    const res = await client.sql`
      INSERT INTO transactions 
      (hash, chainid, adapters, txtimestamp) 
      VALUES (${hash}, ${chainId}, ${JSON.stringify(adapters)}, ${Date.now()})`;

    const data = res.rows;

    return Response.json({
      status: 'success',
    });
  } catch (err) {
    console.log(err);
    return Response.error();
  } finally {
    await client.end();
  }
}
