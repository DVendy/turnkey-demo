export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: "Hello, world!" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return new Response(
    JSON.stringify({ message: "Data received", data: body }),
    {
      headers: { "Content-Type": "application/json" },
      status: 201,
    }
  );
}
