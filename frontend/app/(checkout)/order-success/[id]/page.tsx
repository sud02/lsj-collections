"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Package, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/types/order";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatINR, formatDate } from "@/lib/utils";

export default function OrderSuccessPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Order>(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="bg-cream min-h-screen py-16 md:py-24">
      <div className="container-lsj max-w-xl">
        <div className="bg-white border border-border rounded-lg p-8 md:p-12 text-center shadow-sm">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="w-24 h-24 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Check strokeWidth={3} className="w-12 h-12" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-serif text-3xl md:text-4xl text-dark mb-2">
              Order Placed Successfully!
            </h1>
            <div className="w-16 h-[2px] bg-gold mx-auto mb-4" />
            <p className="text-sm text-gray">
              Thank you for shopping with LSJ Collections. We&apos;ve sent a
              confirmation to your registered email & WhatsApp.
            </p>
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
                  <p className="text-gray">Amount Paid</p>
                  <p className="text-gold font-serif text-base">
                    {formatINR(order.grand_total)}
                  </p>
                </div>
                <div>
                  <p className="text-gray">Placed On</p>
                  <p className="text-dark font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray">Estimated Delivery</p>
                  <p className="text-dark font-medium">
                    {order.estimated_delivery
                      ? formatDate(order.estimated_delivery)
                      : "3-5 business days"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="my-6 text-xs text-gray">
              Order ID: <span className="font-medium">#{id}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/account">
              <Button fullWidth leftIcon={<Package className="w-4 h-4" />}>
                View My Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button
                fullWidth
                variant="outline"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
