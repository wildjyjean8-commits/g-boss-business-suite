import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator as CalcIcon, History, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteCalcMemo, fetchCalcMemos, saveCalcMemo } from "@/lib/gboss/calculator";
import { money } from "@/lib/gboss/data";

type Op = "+" | "−" | "×" | "÷";

function computeResult(a: number, op: Op, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

export function Calculator({
  onUseResult,
  triggerClassName,
}: {
  onUseResult?: (value: number) => void;
  triggerClassName?: string;
}) {
  const { biz } = useBiz();
  const queryClient = useQueryClient();
  const [openHistory, setOpenHistory] = useState(false);

  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expressionLabel, setExpressionLabel] = useState("");
  const [note, setNote] = useState("");

  const memosQuery = useQuery({
    queryKey: ["calc-memos", biz.id],
    queryFn: () => fetchCalcMemos(biz.id),
    enabled: openHistory,
  });

  function clearAll() {
    setDisplay("0");
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpressionLabel("");
  }

  function inputDigit(d: string) {
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  }

  function inputDecimal() {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  }

  function backspace() {
    if (waitingForOperand) return;
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  }

  function percent() {
    setDisplay(String(parseFloat(display) / 100));
  }

  function chooseOperator(nextOp: Op) {
    const value = parseFloat(display);
    if (accumulator === null) {
      setAccumulator(value);
      setExpressionLabel(`${display} ${nextOp}`);
    } else if (operator && !waitingForOperand) {
      const result = computeResult(accumulator, operator, value);
      setAccumulator(result);
      setDisplay(String(result));
      setExpressionLabel(`${result} ${nextOp}`);
    } else {
      setExpressionLabel(`${accumulator} ${nextOp}`);
    }
    setOperator(nextOp);
    setWaitingForOperand(true);
  }

  function equals() {
    const value = parseFloat(display);
    if (operator && accumulator !== null) {
      const result = computeResult(accumulator, operator, value);
      setExpressionLabel(`${accumulator} ${operator} ${value} =`);
      setDisplay(String(result));
      setAccumulator(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }

  const currentValue = parseFloat(display) || 0;

  const saveMutation = useMutation({
    mutationFn: () =>
      saveCalcMemo(biz.id, {
        note: note.trim() || null,
        expression: expressionLabel || null,
        result: currentValue,
      }),
    onSuccess: () => {
      toast.success("Memo anrejistre");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["calc-memos", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erè"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalcMemo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calc-memos", biz.id] }),
  });

  const row0: { label: string; action: () => void }[] = [
    { label: "C", action: clearAll },
    { label: "%", action: percent },
    { label: "⌫", action: backspace },
    { label: "÷", action: () => chooseOperator("÷") },
  ];

  return (
    <Popover onOpenChange={(v) => !v && setOpenHistory(false)}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className={triggerClassName} title="Kalkilatè">
          <CalcIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2" align="end">
        {!openHistory ? (
          <>
            <div className="rounded-lg bg-secondary p-3 text-right">
              <p className="truncate text-xs text-muted-foreground">{expressionLabel || "\u00A0"}</p>
              <p className="gb-num truncate text-2xl font-bold">{display}</p>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {row0.map((k, i) => (
                <Button key={i} type="button" variant="secondary" size="sm" onClick={k.action}>
                  {k.label}
                </Button>
              ))}
              {[7, 8, 9].map((n) => (
                <Button key={n} type="button" variant="outline" size="sm" onClick={() => inputDigit(String(n))}>
                  {n}
                </Button>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => chooseOperator("×")}>
                ×
              </Button>
              {[4, 5, 6].map((n) => (
                <Button key={n} type="button" variant="outline" size="sm" onClick={() => inputDigit(String(n))}>
                  {n}
                </Button>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => chooseOperator("−")}>
                −
              </Button>
              {[1, 2, 3].map((n) => (
                <Button key={n} type="button" variant="outline" size="sm" onClick={() => inputDigit(String(n))}>
                  {n}
                </Button>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => chooseOperator("+")}>
                +
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => inputDigit("0")}>
                0
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={inputDecimal}>
                .
              </Button>
              <Button type="button" className="col-span-2" size="sm" onClick={equals}>
                =
              </Button>
            </div>

            <div className="flex gap-1.5">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nòt (opsyonèl)"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Anrejistre"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setOpenHistory(true)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <History className="size-3.5" /> Istorik memo
              </button>
              {onUseResult ? (
                <Button type="button" size="sm" onClick={() => onUseResult(currentValue)}>
                  Sèvi ak rezilta a
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Dènye memo</p>
              <button type="button" onClick={() => setOpenHistory(false)} className="text-xs text-primary hover:underline">
                Retounen
              </button>
            </div>
            {memosQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Chajman...
              </div>
            ) : (memosQuery.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Okenn memo anrejistre ankò.</p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {(memosQuery.data ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-xs">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setDisplay(String(m.result));
                        setExpressionLabel(m.expression ?? "");
                        setOpenHistory(false);
                      }}
                    >
                      {m.note ? <p className="truncate font-medium">{m.note}</p> : null}
                      <p className="truncate text-muted-foreground">{m.expression ?? "—"}</p>
                    </button>
                    <span className="gb-num font-semibold">{money(m.result, biz.currency)}</span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(m.id)}
                      className="text-destructive hover:opacity-70"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
