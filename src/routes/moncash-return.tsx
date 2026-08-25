import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { Button } from "@/components/ui/button";
import { confirmSubscriptionPayment } from "@/lib/moncash/actions";

const searchSchema = z.object({
  orderId: z.string().optional(),
});

export const Route = createFileRoute("/moncash-return")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Konfirmasyon peman — G-Boss" }, { name: "robots", content: "noindex" }],
  }),
  component: MoncashReturn,
});

type Outcome = "checking" | "completed" | "pending" | "failed" | "not_found";

function MoncashReturn() {
  const { orderId } = Route.useSearch();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<Outcome>("checking");

  useEffect(() => {
    if (!orderId) {
      setOutcome("not_found");
      return;
    }
    let active = true;
    confirmSubscriptionPayment({ data: { orderId } })
      .then((res) => {
        if (active) setOutcome(res.status);
      })
      .catch(() => {
        if (active) setOutcome("failed");
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  const content = {
    checking: {
      icon: <Loader2 className="size-10 animate-spin text-accent" />,
      title: "N ap konfime peman an...",
      desc: "Tanpri patyante pandan n ap verifye tranzaksyon MonCash lan.",
    },
    completed: {
      icon: <CheckCircle2 className="size-10 text-kpi-green" />,
      title: "Peman konfime!",
      desc: "Abònman biznis ou a aktif kounye a.",
    },
    pending: {
      icon: <Loader2 className="size-10 animate-spin text-kpi-orange" />,
      title: "Peman an toujou an trete",
      desc: "Sa ka pran kèk segond — tounen sou Paramèt pou verifye estati a talè.",
    },
    failed: {
      icon: <XCircle className="size-10 text-kpi-red" />,
      title: "Peman an pa reyisi",
      desc: "Eseye ankò nan Paramèt, oswa kontakte sipò si pwoblèm nan kontinye.",
    },
    not_found: {
      icon: <XCircle className="size-10 text-kpi-red" />,
      title: "Nou pa jwenn tranzaksyon sa a",
      desc: "Tounen sou Paramèt pou eseye soumèt peman an ankò.",
    },
  }[outcome];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F8F9FE] px-6 text-center">
      <GBossLogoDark />
      <div className="flex flex-col items-center gap-3">
        {content.icon}
        <h1 className="font-display text-xl font-bold text-[#0A0A14]">{content.title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{content.desc}</p>
      </div>
      <Button onClick={() => navigate({ to: "/app/paramet" })}>Retounen nan Paramèt</Button>
    </div>
  );
}
