"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MapPin, Phone, Mail, ArrowUp, ChevronRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaWhatsapp } from "react-icons/fa";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubLoading(true);
    try {
      await api.post("/subscribe", { email });
      toast.success("Subscribed! Keep an eye on your inbox.");
      setEmail("");
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <footer className="bg-[#252525] text-white/80 mt-20">
        <div className="container-lsj py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Image
              src="/logo_lsj.png"
              alt="LSJ Collections"
              width={1508}
              height={1114}
              className="h-14 w-auto mb-3 brightness-0 invert"
            />
            <div className="font-serif text-[11px] text-gold tracking-[0.3em] uppercase mb-4">
              Premium Hallmark Jewellery
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-5">
              Tirupati&apos;s trusted destination for certified hallmark gold,
              silver and diamond jewellery — crafted with care, delivered with pride.
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                VV Mahal Rd, Reddy and Reddy&apos;s Colony, Tirupati, AP 517501
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a href="tel:+918309409007" className="hover:text-gold-light">+91 83094 09007</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a href="mailto:support@lsjcollections.com" className="hover:text-gold-light">support@lsjcollections.com</a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-serif text-white text-base mb-4">Quick Shop</h5>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/products", label: "All Products" },
                { href: "/popular", label: "Popular Collections" },
                { href: "/new-arrivals", label: "New Arrivals" },
                { href: "/lakshmi-kubera", label: "Lakshmi Kubera" },
                { href: "/contact", label: "Contact Us" },
                { href: "/faqs", label: "FAQs" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center gap-1 hover:text-gold-light transition-colors">
                    <ChevronRight className="w-3 h-3 text-gold" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-serif text-white text-base mb-4">Policies</h5>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/terms-conditions", label: "Terms & Conditions" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/shipping-policy", label: "Shipping Policy" },
                { href: "/return-refund-policy", label: "Return & Refund Policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center gap-1 hover:text-gold-light transition-colors">
                    <ChevronRight className="w-3 h-3 text-gold" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-serif text-white text-base mb-4">Stay Updated</h5>
            <p className="text-xs text-white/60 mb-3">
              Get exclusive collections, festive offers & jewellery care tips.
            </p>
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your email address"
                className="flex-1 h-11 px-3 bg-white/10 border border-white/10 rounded text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-gold"
              />
              <Button type="submit" size="sm" loading={subLoading}>Subscribe</Button>
            </form>

            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: FaFacebookF, href: "#" },
                { Icon: FaInstagram, href: "#" },
                { Icon: FaTwitter, href: "#" },
                { Icon: FaYoutube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label="Social"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-white transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-lsj py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-white/50">
            <p>
              © {new Date().getFullYear()} LSJ Collections. All rights reserved.
              Hallmark Jewellery crafted in Tirupati.
            </p>
            <div className="flex items-center gap-2">
              <span>We accept:</span>
              <div className="flex items-center gap-1 text-white/70">
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] border border-white/10">VISA</span>
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] border border-white/10">MC</span>
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] border border-white/10">UPI</span>
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] border border-white/10">PhonePe</span>
                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] border border-white/10">Rupay</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp float */}
      <a
        href="https://wa.me/918309409007"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-24 md:bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <FaWhatsapp className="w-6 h-6" />
      </a>

      {/* Back to top */}
      <button
        onClick={toTop}
        aria-label="Back to top"
        className="fixed bottom-24 md:bottom-6 right-20 md:right-20 z-40 w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center shadow-md hover:bg-gold-dark transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </>
  );
}
