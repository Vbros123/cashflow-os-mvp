export const dynamic = "force-dynamic";

export function POST() {
  return Response.json({
    provider: "mock_plaid",
    link_token: "mock_plaid_link_token_demo",
    expiration: new Date().toISOString()
  });
}
