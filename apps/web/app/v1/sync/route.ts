import { syncDemo } from "@/lib/demo-api";

export const dynamic = "force-dynamic";

export function POST() {
  return Response.json(syncDemo());
}
