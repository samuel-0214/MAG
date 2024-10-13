export async function POST(request: Request) {
  const { name } = await request.json();

  //https://www.base.org/api/name/0xjayesh
  const res = await fetch(`https://www.base.org/api/name/${name}`).then((res) => res.json());

  return Response.json(res);
}
