"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Package, ArrowRight, X, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/types/order";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatINR, formatDate } from "@/lib/utils";

type PayState = "paid" | "failed" | "pending" | "unresolved" | "unknown";

export default function OrderSuccessPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [payState, setPayState] = useState<PayState>("pending");
  const [retrying, setRetrying] = useState(false);
  const polls = useRef(0);

  // Reconciles with PhonePe on the backend and returns the current status.
  const checkStatus = useCallback(async (): Promise<PayState> => {
    try {
      const { data } = await api.get<{ payment_status: string }>(`/payment/status/${id}`);
      const s = data.payment_status;
      return s === "paid" || s === "failed" || s === "pending" ? (s as PayState) : "unknown";
    } catch {
      return "unknown";
    }
  }, [id]);

  const runningRef = useRef(false);

  const poll = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const step = async () => {
      const s = await checkStatus();
      if (s === "pending" && polls.current < 5) {
        polls.current += 1;
        setPayState("pending");
        timer = setTimeout(step, 3000);
      } else {
        // Polled out but still pending → surface an actionable "unresolved" state.
        setPayState(s === "pending" ? "unresolved" : s);
        runningRef.current = false;
      }
    };
    await step();
    return () => clearTimeout(timer);
  }, [checkStatus]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get<Order>(`/orders/${id}`).then((r) => alive && setOrder(r.data)).catch(() => {}),
      poll(),
    ]).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, poll]);

  const checkAgain = () => {
    polls.current = 0;
    runningRef.current = false;
    setPayState("pending");
    poll();
  };

  const retryPayment = async () => {
    setRetrying(true);
    try {
      const { data } = await api.post<{ redirect_url: string }>("/payment/initiate", {
        order_id: Number(id),
        origin: window.location.origin,
      });
      if (data.redirect_url) window.location.href = data.redirect_url;
      else setRetrying(false);
    } catch {
      setRetrying(false);
    }
  };

  const isPaid = payState === "paid";
  const isPending = payState === "pending";
  // failed / unresolved / unknown are all "not confirmed" → offer retry + re-check.
  const needsAction = payState === "failed" || payState === "unresolved" || payState === "unknown";

  const head = isPaid
    ? { color: "bg-green-500", icon: <Check strokeWidth={3} className="w-12 h-12" />, title: "Order Placed Successfully!", sub: "Thank you for shopping with LSJ Collections. We've sent a confirmation to your registered email." }
    : payState === "failed"
    ? { color: "bg-red-500", icon: <X strokeWidth={3} className="w-12 h-12" />, title: "Payment Failed", sub: "Your payment didn't go through and you have not been charged. You can try again below." }
    : needsAction
    ? { color: "bg-gold-dark", icon: <X strokeWidth={3} className="w-12 h-12" />, title: "Payment Not Completed", sub: "We couldn't confirm your payment. If money was deducted it will be auto-refunded. You can retry or re-check the status below." }
    : { color: "bg-gold", icon: <Loader2 className="w-12 h-12 animate-spin" />, title: "Confirming your payment…", sub: "This can take a few seconds. Please don't close this page." };

  return (
    <div className="bg-cream min-h-screen py-16 md:py-24">
      <div className="container-lsj max-w-xl">
        <div className="bg-white border border-border rounded-lg p-8 md:p-12 text-center shadow-sm">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={`w-24 h-24 rounded-full ${head.color} text-white flex items-center justify-center mx-auto mb-6 shadow-lg`}
          >
            {head.icon}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-serif text-3xl md:text-4xl text-dark mb-2">{head.title}</h1>
            <div className="w-16 h-[2px] bg-gold mx-auto mb-4" />
            <p className="text-sm text-gray">{head.sub}</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : order ? (
            <div className="my-6 p-5 bg-gold-bg/60 border border-gold-light/60 rounded-lg text-left">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray">Order ID</p>
                  <p className="text-dark font-medium">#{order.order_number || order.id}</p>
                </div>
                <div>
                  <p className="text-gray">{isPaid ? "Amount Paid" : "Amount"}</p>
                  <p className="text-gold font-serif text-base">{formatINR(order.grand_total)}</p>
                </div>
                <div>
                  <p className="text-gray">Placed On</p>
                  <p className="text-dark font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray">Payment</p>
                  <p className="text-dark font-medium capitalize">
                    {payState === "paid"
                      ? "paid"
                      : payState === "failed"
                      ? "failed"
                      : payState === "pending"
                      ? "processing"
                      : "not completed"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="my-6 text-xs text-gray">
              Order ID: <span className="font-medium">#{id}</span>
            </p>
          )}

          {needsAction ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button fullWidth loading={retrying} onClick={retryPayment} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Retry Payment
                </Button>
                <Button fullWidth variant="outline" onClick={checkAgain}>
                  I&apos;ve paid — check again
                </Button>
              </div>
              <Link href="/account" className="block">
                <Button fullWidth variant="ghost">View My Orders</Button>
              </Link>
            </div>
          ) : isPending ? (
            <p className="text-xs text-gray">Please wait — do not refresh or close this page.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/account">
                <Button fullWidth leftIcon={<Package className="w-4 h-4" />}>View My Orders</Button>
              </Link>
              <Link href="/products">
                <Button fullWidth variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
