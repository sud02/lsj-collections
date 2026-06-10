"use client";
import { useState } from "react";
import { ChevronDown, Mail, Phone, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is your jewellery hallmark certified?",
    a: "Yes — every piece of gold jewellery at LSJ Collections is BIS hallmark certified. The certification confirms purity (22K / 24K) and is stamped on the jewellery itself.",
  },
  {
    q: "How is the price of gold jewellery calculated?",
    a: "Price = (Gold rate × weight) + Making charges + GST 3%. For studded jewellery, stone weight and quality are billed separately. We follow transparent pricing — no hidden charges.",
  },
  {
    q: "Do you offer customization or custom designs?",
    a: "Absolutely. You can upload a reference image on any product page (after logging in) and our craftsmen will create a piece tailored to your specifications. Lead times typically range from 7–21 days depending on complexity.",
  },
  {
    q: "What is your return / refund policy?",
    a: "We offer a 15-day easy return on most products in unused, original condition with the hallmark tag intact. Customised, engraved or pierced jewellery cannot be returned. See our Return & Refund Policy for full details.",
  },
  {
    q: "How long does delivery take?",
    a: "Ready-to-ship pieces are dispatched within 24 hours and delivered in 3–5 business days across India. Made-to-order and custom pieces take 7–21 days. Free shipping on orders above ₹5,000.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. We process all payments through PhonePe with SSL encryption. We never store your card or UPI details on our servers.",
  },
  {
    q: "Do you offer gold exchange or buyback?",
    a: "Yes — bring your old gold jewellery to our Tirupati store for exchange against new pieces, or for buyback at the day's prevailing market rate. Hallmark-certified gold is preferred.",
  },
  {
    q: "How do I care for my hallmark jewellery?",
    a: "Store each piece in a separate pouch to prevent scratches. Avoid contact with perfumes, lotions and chlorinated water. We offer free polishing and cleaning services at our store.",
  },
];

export default function FAQsPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "FAQs" }]} />

        <div className="mt-2 mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Helpful answers</p>
          <h1 className="font-serif text-3xl md:text-4xl text-dark mt-1">Frequently Asked Questions</h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "border border-border rounded-lg overflow-hidden transition-all",
                  open === i ? "bg-gold-bg/50 border-gold-light" : "bg-white"
                )}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className={cn("font-serif text-base", open === i ? "text-gold" : "text-dark")}>
                    {f.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform",
                      open === i ? "rotate-180 text-gold" : "text-gray"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-gray leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-white border border-border rounded-lg p-6 sticky top-28">
              <h4 className="font-serif text-lg text-dark mb-1">Still have questions?</h4>
              <p className="text-xs text-gray mb-4">
                Our team is happy to help. Reach out via any of the channels below.
              </p>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:support@lsjcollections.com" className="flex items-center gap-3 group">
                    <span className="w-9 h-9 rounded-full bg-gold-bg text-gold flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs text-gray">Email</p>
                      <p className="text-sm text-dark group-hover:text-gold">support@lsjcollections.com</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="tel:+918309409007" className="flex items-center gap-3 group">
                    <span className="w-9 h-9 rounded-full bg-gold-bg text-gold flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs text-gray">Phone</p>
                      <p className="text-sm text-dark group-hover:text-gold">+91 83094 09007</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/918309409007"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    <span className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs text-gray">WhatsApp</p>
                      <p className="text-sm text-dark group-hover:text-green-700">Chat with us</p>
                    </div>
                  </a>
                </li>
              </ul>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-1 text-sm text-gold font-medium hover:text-gold-dark"
              >
                Send a Message <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
