import { getDashboard } from "@/lib/demo-api";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(getDashboard().accounts);
}
