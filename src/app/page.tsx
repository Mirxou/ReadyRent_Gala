"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Compass,
  Mailbox,
  Package,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrowseTab } from "@/components/rental/browse-tab";
import { MerchantTab } from "@/components/rental/merchant-tab";
import { MyBookingsTab } from "@/components/rental/my-bookings-tab";
import { OutboxTab } from "@/components/rental/outbox-tab";
import { getJson } from "@/components/rental/api";
import type { CustomersResponse } from "@/lib/types";

type TabKey = "browse" | "bookings" | "merchant" | "outbox";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("browse");
  const queryClient = useQueryClient();

  // demo identity — first customer (أمين بلقاسم)
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => getJson<CustomersResponse>("/api/customers"),
  });
  const demoCustomer = customersQuery.data?.customers?.[0];

  function handleBooked() {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["emails"] });
    setTab("bookings");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Package className="size-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-extrabold sm:text-lg">كراء بلا همّ</h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                منصة كراء المعدات بالضمان
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="hidden border-emerald-200 bg-emerald-50 text-emerald-800 md:inline-flex"
          >
            <ShieldCheck className="size-3" />
            الضمان محتجز بشفافية
          </Badge>

          {/* demo identity chip */}
          <div className="ms-auto flex items-center gap-2 rounded-full border border-border bg-card py-1.5 ps-1.5 pe-3 shadow-sm">
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <UserRound className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold">
                {demoCustomer?.name ?? "أمين بلقاسم"}
              </p>
              <p className="hidden text-[10px] text-muted-foreground sm:block">
                {demoCustomer?.email ?? "الزبون التجريبي"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Tabs
          dir="rtl"
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="gap-6"
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1 sm:w-fit">
            <TabsTrigger value="browse" className="gap-1.5 rounded-lg px-3 py-1.5">
              <Compass className="size-4" />
              تصفّح
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="gap-1.5 rounded-lg px-3 py-1.5"
            >
              <ClipboardList className="size-4" />
              حجوزاتي
            </TabsTrigger>
            <TabsTrigger
              value="merchant"
              className="gap-1.5 rounded-lg px-3 py-1.5"
            >
              <Store className="size-4" />
              لوحة التاجر
            </TabsTrigger>
            <TabsTrigger
              value="outbox"
              className="gap-1.5 rounded-lg px-3 py-1.5"
            >
              <Mailbox className="size-4" />
              صندوق الصادر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <BrowseTab customerId={demoCustomer?.id} onBooked={handleBooked} />
          </TabsContent>

          <TabsContent value="bookings">
            <MyBookingsTab customerId={demoCustomer?.id} />
          </TabsContent>

          <TabsContent value="merchant">
            <MerchantTab />
          </TabsContent>

          <TabsContent value="outbox">
            <OutboxTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer (sticky-to-bottom via mt-auto) ─────────────────── */}
      <footer className="mt-auto border-t border-border bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1.5 px-4 py-6 text-center">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <ShieldCheck className="size-4" />
            كراء بلا همّ — الضمان محتجز بشفافية
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            كل حجز يُفصَل بوضوح: الكراء + الضمان المحتجز في حساب وسيط (يُعاد بعد
            الإرجاع) + التأمين. الإيصالات والإشعارات تصلك لحظة بلحظة عبر صندوق
            الصادر المحاكى للبريد الإلكتروني.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            © كراء بلا همّ — نموذج تجريبي لأغراض العرض
          </p>
        </div>
      </footer>
    </div>
  );
}
