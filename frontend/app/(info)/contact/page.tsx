"use client";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const cards = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["VV Mahal Rd, Reddy and Reddy's Colony", "Tirupati, Andhra Pradesh 517501"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+91 83094 09007"],
    href: "tel:+918309409007",
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["support@lsjcollections.com"],
    href: "mailto:support@lsjcollections.com",
  },
  {
    icon: Clock,
    title: "Hours",
    lines: ["Mon–Sat · 10AM – 8PM", "Sun · 11AM – 6PM"],
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Thanks! We'll be in touch shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: "Contact Us" }]} />

        <div className="mt-2 mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">We&apos;d love to hear from you</p>
          <h1 className="font-serif text-3xl md:text-4xl text-dark mt-1">Get in Touch</h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-border rounded-lg p-6 md:p-8">
            <h3 className="font-serif text-xl text-dark mb-1">Send us a message</h3>
            <p className="text-sm text-gray mb-6">
              Have a question about a piece, custom order, or repair? Drop us a note.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Full Name" required value={form.name} onChange={onChange("name")} placeholder="Your name" />
                <Input label="Email" required type="email" value={form.email} onChange={onChange("email")} placeholder="you@example.com" />
              </div>
              <Input label="Subject" required value={form.subject} onChange={onChange("subject")} placeholder="How can we help?" />
              <div>
                <label className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={onChange("message")}
                  placeholder="Tell us a bit about your enquiry…"
                  className="w-full p-3 bg-gray-light border border-border rounded text-sm focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <Button type="submit" size="lg" loading={loading} leftIcon={<Send className="w-4 h-4" />}>
                Send Message
              </Button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-lg overflow-hidden border border-border h-64">
              <iframe
                src="https://www.google.com/maps?q=Tirupati,+Andhra+Pradesh,+India&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {cards.map((c) => {
                const Icon = c.icon;
                const Body = (
                  <div className="bg-white border border-border rounded-lg p-4 h-full hover:shadow-sm hover:-translate-y-0.5 transition-all">
                    <div className="w-10 h-10 rounded-full bg-gold-bg text-gold flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-dark font-medium">{c.title}</p>
                    {c.lines.map((l) => (
                      <p key={l} className="text-xs text-gray mt-0.5">{l}</p>
                    ))}
                  </div>
                );
                return c.href ? (
                  <a key={c.title} href={c.href} className="block">{Body}</a>
                ) : (
                  <div key={c.title}>{Body}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
