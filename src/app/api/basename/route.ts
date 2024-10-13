export async function POST(request: Request) {
  const { name } = await request.json();

  //https://www.base.org/api/name/0xjayesh
  try {
    const res = await fetch(`https://www.base.org/api/name/${name}`).then((res) => res.json());
    return Response.json(res);
  } catch (e) {
    return new Response(`Error: ${e}`, { status: 500 });
  }
}
