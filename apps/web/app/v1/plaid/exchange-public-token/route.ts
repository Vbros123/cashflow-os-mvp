export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json()) as { public_token?: string };
  return Response.json({
    item_id: `item_${Math.abs(hash(payload.public_token ?? "demo"))}`,
    institution_name: "Mercury",
    status: "connected"
  });
}

function hash(value: string) {
  return value.split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) | 0, 0);
}
