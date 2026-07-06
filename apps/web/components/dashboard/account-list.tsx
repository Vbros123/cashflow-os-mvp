import { Landmark } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { preciseCurrency } from "@/lib/utils";
import type { BankAccount } from "@/lib/types";

export function AccountList({ accounts }: { accounts: BankAccount[] }) {
  return (
    <Card className="min-h-[316px]">
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
        <Badge variant="neutral">{accounts.length}</Badge>
      </CardHeader>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.id} className="flex min-h-20 items-center justify-between gap-3 rounded-md border border-line bg-[#fbfcfd] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef3f7] text-cobalt">
                <Landmark aria-hidden="true" size={19} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {account.institution_name} {account.account_type}
                </p>
                <p className="text-xs text-[#617080]">•••• {account.mask}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{preciseCurrency.format(account.available_balance)}</p>
              <Badge variant={account.connected ? "low" : "medium"}>{account.connected ? "connected" : "pending"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
