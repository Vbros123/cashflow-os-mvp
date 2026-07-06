import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compactDate, preciseCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <Badge variant="neutral">{transactions.length}</Badge>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase text-[#617080]">
              <th className="h-10 px-2">Date</th>
              <th className="h-10 px-2">Merchant</th>
              <th className="h-10 px-2">Category</th>
              <th className="h-10 px-2">Description</th>
              <th className="h-10 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 14).map((transaction) => {
              const positive = transaction.amount >= 0;
              const Icon = positive ? ArrowUpRight : ArrowDownLeft;
              return (
                <tr key={transaction.id} className="border-b border-[#edf1f4] last:border-0">
                  <td className="h-12 px-2 text-[#617080]">{compactDate(transaction.posted_at)}</td>
                  <td className="h-12 px-2 font-medium text-ink">
                    <span className="inline-flex items-center gap-2">
                      <Icon aria-hidden="true" size={16} className={positive ? "text-mint" : "text-coral"} />
                      {transaction.merchant}
                    </span>
                  </td>
                  <td className="h-12 px-2">
                    <Badge variant="neutral">{transaction.category}</Badge>
                  </td>
                  <td className="h-12 px-2 text-[#617080]">{transaction.description}</td>
                  <td className={`h-12 px-2 text-right font-semibold ${positive ? "text-mint" : "text-ink"}`}>
                    {preciseCurrency.format(transaction.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
