"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Coins, Wallet, CalendarCheck, Gift, Gem, ShieldCheck,
  TrendingUp, Check, ChevronDown, ArrowRight, PartyPopper,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { formatINR } from "@/lib/utils";

const WA_NUMBER = "918309409007";
const wa = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

const PRESETS = [1000, 2000, 3000, 5000, 10000, 25000, 50000];
const MIN = 1000;
const MAX = 50000;
const PLANS = [1000, 5000, 10000, 25000, 50000];

const savingsOf = (m: number) => m * 11;
const benefitOf = (m: number) => m;
const totalOf = (m: number) => m * 12;

export default function LakshmiKuberaSchemePage() {
  const [amount, setAmount] = useState(5000);
  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n / 1000) * 1000));

  const calc = useMemo(
    () => ({ monthly: amount, savings: savingsOf(amount), benefit: benefitOf(amount), total: totalOf(amount) }),
    [amount]
  );

  return (
    <div className="bg-cream">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-dark text-white">
        <Image
          src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1800&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/70 via-dark/85 to-dark" />
        <div className="relative container-lsj py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-gold/90 text-white text-[11px] tracking-[0.3em] uppercase mb-6 animate-fade-in">
            <Sparkles className="w-3 h-3" /> Jewellery Savings Scheme
          </div>
          <h1 className="font-serif text-4xl md:text-6xl tracking-wide mb-4 text-balance">
            Lakshmi Kubera Scheme
          </h1>
          <p className="font-serif text-xl md:text-2xl text-gold-light mb-5">
            &ldquo;Save Monthly. Celebrate Bigger.&rdquo;
          </p>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-6" />
          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Plan your jewellery purchase with our Lakshmi Kubera Scheme. Choose an amount that suits
            your budget, save every month for 11 months, and receive an additional benefit equal to
            one month&apos;s contribution on successful completion of the scheme.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <a href={wa("Hello! I'd like to join the Lakshmi Kubera Scheme.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 h-12 rounded-pill bg-gold text-white font-medium tracking-wide hover:bg-gold-dark transition-all hover:-translate-y-0.5 shadow-md">
              <FaWhatsapp className="w-4 h-4" /> Join Lakshmi Kubera
            </a>
            <a href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 h-12 rounded-pill border border-white/40 text-white font-medium tracking-wide hover:bg-white hover:text-dark transition-all">
              How It Works
            </a>
          </div>
          {/* At-a-glance flow */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs md:text-sm text-white/70">
            {["Monthly Amount", "11 Months", "Kubera Benefit", "Total Jewellery Value"].map((s, i) => (
              <span key={s} className="inline-flex items-center gap-3">
                <span className="px-3 py-1 rounded-pill bg-white/10 border border-white/15 text-white/90">{s}</span>
                {i < 3 && <ArrowRight className="w-3.5 h-3.5 text-gold" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container-lsj pt-6">
        <Breadcrumb items={[{ label: "Lakshmi Kubera Scheme" }]} />
      </div>

      {/* ── CALCULATOR ───────────────────────────────────── */}
      <section className="py-14">
        <div className="container-lsj">
          <SectionHead eyebrow="Scheme Calculator" title="See Your Savings Grow" />
          <div className="mt-8 grid lg:grid-cols-12 gap-6 items-start">
            {/* Chooser */}
            <div className="lg:col-span-5 bg-white border border-border rounded-lg p-6 md:p-7 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray mb-3">
                Choose your monthly contribution
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button key={p} onClick={() => setAmount(p)}
                    className={`h-11 rounded text-sm font-medium border transition-colors ${
                      amount === p ? "bg-gold text-white border-gold" : "bg-gray-light text-dark border-border hover:border-gold hover:text-gold"
                    }`}>
                    {formatINR(p)}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray">Or pick a custom amount</label>
                  <span className="font-serif text-xl text-gold">{formatINR(amount)}</span>
                </div>
                <input type="range" min={MIN} max={MAX} step={1000} value={amount}
                  onChange={(e) => setAmount(clamp(Number(e.target.value)))}
                  className="w-full accent-gold" />
                <div className="flex justify-between text-[11px] text-gray-mid mt-1">
                  <span>{formatINR(MIN)}</span><span>{formatINR(MAX)}</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              <ResultCard icon={Wallet} label="Your Monthly Contribution" value={formatINR(calc.monthly)} tone="plain" />
              <ResultCard icon={CalendarCheck} label="Your 11-Month Savings" value={formatINR(calc.savings)} tone="plain" />
              <ResultCard icon={Gift} label="Lakshmi Kubera Benefit" value={`+ ${formatINR(calc.benefit)}`} tone="accent" />
              <ResultCard icon={Gem} label="Total Jewellery Value" value={formatINR(calc.total)} tone="gold" />
              <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gold-bg border border-gold-light/60 rounded-lg p-5">
                <p className="text-xs text-gray leading-relaxed">
                  Pay for <span className="font-medium text-dark">11 months</span> and receive an additional benefit
                  equivalent to <span className="font-medium text-dark">one month&apos;s contribution</span>, subject to the scheme terms.
                </p>
                <a href={wa(`I'd like to join the Lakshmi Kubera Scheme with the ${formatINR(amount)}/month plan (11 months, total value ${formatINR(totalOf(amount))}).`)}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-6 h-11 rounded-pill bg-gold text-white text-sm font-medium hover:bg-gold-dark transition-all whitespace-nowrap">
                  <FaWhatsapp className="w-4 h-4" /> Join this plan
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXAMPLE ──────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container-lsj">
          <SectionHead eyebrow="A Simple Example" title="If You Choose ₹5,000 Per Month" />
          <div className="mt-8 grid md:grid-cols-4 gap-4 items-stretch">
            <ExampleCard icon={CalendarCheck} top="11 months × ₹5,000" big="₹55,000" note="Total saved by you" />
            <ExampleCard icon={Gift} top="Lakshmi Kubera Benefit" big="+ ₹5,000" note="One month's contribution" accent />
            <div className="hidden md:flex items-center justify-center text-gold">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div className="rounded-lg bg-gradient-to-br from-gold to-gold-dark text-white p-6 text-center flex flex-col justify-center shadow-md">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/80">Your total jewellery value</p>
              <p className="font-serif text-4xl md:text-5xl mt-2">₹60,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-14 scroll-mt-24">
        <div className="container-lsj">
          <SectionHead eyebrow="How It Works" title="Four Simple Steps" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: 1, icon: Wallet, t: "Choose Your Amount", d: "Choose a monthly amount that fits your budget, from ₹1,000 to ₹50,000." },
              { n: 2, icon: CalendarCheck, t: "Save For 11 Months", d: "Make your selected monthly contribution for 11 months." },
              { n: 3, icon: Check, t: "Complete Your Scheme", d: "Once all 11 monthly contributions are successfully completed, your scheme becomes eligible for the applicable Lakshmi Kubera benefit." },
              { n: 4, icon: Gem, t: "Shop Your Dream Jewellery", d: "Use your accumulated scheme value and applicable benefit toward an eligible jewellery purchase, per the scheme terms." },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="relative bg-white border border-border rounded-lg p-6 hover:-translate-y-1 hover:shadow-md transition-all">
                  <span className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-dark text-white text-sm font-serif flex items-center justify-center">{s.n}</span>
                  <div className="w-12 h-12 rounded-full bg-gold-bg text-gold flex items-center justify-center mt-3 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg text-dark">{s.t}</h3>
                  <p className="text-sm text-gray mt-2 leading-relaxed">{s.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PLAN OPTIONS ─────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container-lsj">
          <SectionHead eyebrow="Plan Options" title="A Plan For Every Budget" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((m) => {
              const featured = m === 5000;
              return (
                <div key={m}
                  className={`rounded-lg p-6 flex flex-col text-center transition-all hover:-translate-y-1 ${
                    featured ? "bg-dark text-white shadow-lg ring-2 ring-gold" : "bg-cream border border-border hover:shadow-md"
                  }`}>
                  {featured && (
                    <span className="self-center mb-2 px-3 py-0.5 rounded-pill bg-gold text-white text-[10px] uppercase tracking-wide">Most Popular</span>
                  )}
                  <p className={`font-serif text-2xl ${featured ? "text-gold-light" : "text-gold"}`}>{formatINR(m)}</p>
                  <p className={`text-[11px] uppercase tracking-wide ${featured ? "text-white/60" : "text-gray"}`}>per month</p>

                  <dl className={`mt-4 space-y-2 text-sm ${featured ? "text-white/85" : "text-dark"}`}>
                    <Row featured={featured} k="11-Month Savings" v={formatINR(savingsOf(m))} />
                    <Row featured={featured} k="Kubera Benefit" v={`+ ${formatINR(benefitOf(m))}`} accent />
                    <div className={`pt-2 mt-2 border-t ${featured ? "border-white/15" : "border-border"}`}>
                      <p className={`text-[11px] uppercase tracking-wide ${featured ? "text-white/60" : "text-gray"}`}>Total Value</p>
                      <p className="font-serif text-2xl">{formatINR(totalOf(m))}</p>
                    </div>
                  </dl>

                  <a href={wa(`I'd like to join the Lakshmi Kubera Scheme — ${formatINR(m)}/month plan (total value ${formatINR(totalOf(m))}).`)}
                    target="_blank" rel="noopener noreferrer"
                    className={`mt-5 inline-flex items-center justify-center gap-2 h-10 rounded-pill text-sm font-medium transition-all ${
                      featured ? "bg-gold text-white hover:bg-gold-dark" : "border border-gold text-gold hover:bg-gold hover:text-white"
                    }`}>
                    Choose This Plan
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ───────────────────────────────────── */}
      <section className="py-14">
        <div className="container-lsj">
          <SectionHead eyebrow="Why Choose" title="Why Lakshmi Kubera?" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Wallet, t: "Easy Monthly Saving", d: "Choose a monthly amount according to your budget." },
              { icon: TrendingUp, t: "Disciplined Saving", d: "Build your jewellery purchase fund over 11 months." },
              { icon: Gift, t: "Extra Scheme Benefit", d: "Receive an additional benefit equivalent to one month's contribution upon successful completion, subject to scheme terms." },
              { icon: Gem, t: "Dream Jewellery", d: "Use your accumulated scheme value toward your jewellery purchase." },
              { icon: ShieldCheck, t: "Simple & Transparent", d: "Clearly see your contribution, progress and applicable benefit." },
              { icon: Coins, t: "Trusted Jewellery Brand", d: "A jewellery savings experience from Lakshmi Srinivasa Jewellery." },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.t} className="flex gap-4 bg-white border border-border rounded-lg p-5 hover:shadow-sm transition-all">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-teal-bg text-teal-dark flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-dark leading-tight">{b.t}</h3>
                    <p className="text-sm text-gray mt-1 leading-relaxed">{b.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SAVINGS JOURNEY ──────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container-lsj">
          <SectionHead eyebrow="Your Savings Journey" title="Every Month Brings You Closer" />
          <p className="text-center text-sm text-gray mt-3">Example based on a ₹5,000 monthly plan</p>

          {/* Month chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((mo) => (
              <div key={mo} className="w-[84px] rounded-lg border border-border bg-cream px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray">Month {mo}</p>
                <p className="font-serif text-base text-dark">₹5,000</p>
              </div>
            ))}
          </div>

          {/* Milestone flow */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Milestone icon={PartyPopper} label="Scheme Completed" value="₹55,000 saved" tone="dark" />
            <ChevronDown className="w-5 h-5 text-gold" />
            <Milestone icon={Gift} label="Lakshmi Kubera Benefit" value="+ ₹5,000" tone="accent" />
            <ChevronDown className="w-5 h-5 text-gold" />
            <Milestone icon={Gem} label="Total Jewellery Value" value="₹60,000" tone="gold" />
          </div>
        </div>
      </section>

      {/* ── DREAM JEWELLERY ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-dark text-white">
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1800&q=80"
          alt="" fill sizes="100vw" className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-dark/40" />
        <div className="relative container-lsj py-16 md:py-20 text-center md:text-left max-w-2xl">
          <h2 className="font-serif text-3xl md:text-5xl mb-4">Save Today. Shine Tomorrow.</h2>
          <div className="w-16 h-[2px] bg-gold mb-5 mx-auto md:mx-0" />
          <p className="text-white/80 leading-relaxed mb-7">
            Turn your monthly savings into something timeless. Complete your Lakshmi Kubera Scheme and
            take the next step toward the jewellery you&apos;ve always wanted.
          </p>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-8 h-12 rounded-pill bg-gold text-white font-medium tracking-wide hover:bg-gold-dark transition-all hover:-translate-y-0.5 shadow-md">
            Explore Jewellery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="py-14">
        <div className="container-lsj max-w-3xl">
          <SectionHead eyebrow="Questions" title="Frequently Asked Questions" />
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── TERMS ────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container-lsj max-w-3xl">
          <h2 className="font-serif text-2xl md:text-3xl text-dark text-center">Lakshmi Kubera Scheme — Terms &amp; Conditions</h2>
          <div className="gold-divider" />
          <ul className="mt-6 space-y-3 text-sm text-gray">
            {[
              "The scheme requires 11 monthly contributions.",
              "The monthly contribution selected at enrolment determines the applicable scheme benefit.",
              "The applicable benefit is provided upon successful completion of the scheme and subject to the scheme terms.",
              "Redemption is subject to eligible jewellery purchases and applicable conditions.",
              "Rules regarding missed payments, cancellation, refunds, redemption, taxes, jewellery eligibility and other conditions are governed by the official scheme terms.",
              "Customers should read the complete terms before joining.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-gray-mid italic text-center">
            The Lakshmi Kubera Scheme is a jewellery savings plan, not a bank deposit or investment product.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-gold-bg to-cream">
        <div className="container-lsj text-center max-w-2xl">
          <h2 className="font-serif text-3xl md:text-4xl text-dark leading-tight">
            Your dream jewellery starts with a small monthly step.
          </h2>
          <p className="text-gray mt-4">
            Choose your Lakshmi Kubera plan today and begin your journey toward something beautiful.
          </p>
          <a href={wa("Hello! I'd like to join the Lakshmi Kubera Scheme.")} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-pill bg-gold text-white font-medium tracking-wide hover:bg-gold-dark transition-all hover:-translate-y-0.5 shadow-md">
            <FaWhatsapp className="w-4 h-4" /> Join Lakshmi Kubera
          </a>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray">
            <span className="inline-flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-gold" /> ₹1,000 to ₹50,000 monthly plans</span>
            <span className="inline-flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-gold" /> 11 months of saving</span>
            <span className="inline-flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-gold" /> Extra Kubera benefit on completion*</span>
          </div>
          <p className="mt-3 text-[11px] text-gray-mid">*Subject to scheme terms.</p>
        </div>
      </section>
    </div>
  );
}

/* ── small building blocks ─────────────────────────────── */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      <h2 className="font-serif text-2xl md:text-3xl text-dark mt-1">{title}</h2>
      <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: "plain" | "accent" | "gold" }) {
  const styles =
    tone === "gold" ? "bg-gradient-to-br from-gold to-gold-dark text-white border-transparent"
    : tone === "accent" ? "bg-teal-bg text-dark border-teal-light/50"
    : "bg-white text-dark border-border";
  const iconWrap = tone === "gold" ? "bg-white/20 text-white" : tone === "accent" ? "bg-teal text-white" : "bg-gold-bg text-gold";
  return (
    <div className={`rounded-lg border p-5 ${styles}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${iconWrap}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`text-[11px] uppercase tracking-wide ${tone === "gold" ? "text-white/80" : "text-gray"}`}>{label}</p>
      <p className="font-serif text-3xl mt-1">{value}</p>
    </div>
  );
}

function ExampleCard({ icon: Icon, top, big, note, accent }: { icon: React.ElementType; top: string; big: string; note: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-6 text-center ${accent ? "bg-teal-bg border-teal-light/50" : "bg-cream border-border"}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3 ${accent ? "bg-teal text-white" : "bg-gold-bg text-gold"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray">{top}</p>
      <p className="font-serif text-3xl text-dark mt-1">{big}</p>
      <p className="text-[11px] text-gray-mid mt-1">{note}</p>
    </div>
  );
}

function Row({ k, v, featured, accent }: { k: string; v: string; featured?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={featured ? "text-white/60" : "text-gray"}>{k}</dt>
      <dd className={`font-medium ${accent ? (featured ? "text-gold-light" : "text-teal-dark") : ""}`}>{v}</dd>
    </div>
  );
}

function Milestone({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: "dark" | "accent" | "gold" }) {
  const styles =
    tone === "gold" ? "bg-gradient-to-br from-gold to-gold-dark text-white"
    : tone === "accent" ? "bg-teal text-white"
    : "bg-dark text-white";
  return (
    <div className={`w-full max-w-sm rounded-lg px-5 py-4 flex items-center gap-4 ${styles}`}>
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wide text-white/70">{label}</p>
        <p className="font-serif text-2xl">{value}</p>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-medium text-dark text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gold shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-gray leading-relaxed">{a}</div>}
    </div>
  );
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: "What is the Lakshmi Kubera Scheme?", a: "It is a jewellery savings scheme where customers choose a monthly contribution and make payments for 11 months. Upon successful completion, the customer becomes eligible for the applicable Lakshmi Kubera benefit according to the scheme terms." },
  { q: "How much can I contribute every month?", a: "Customers can choose a monthly contribution from ₹1,000 up to ₹50,000, subject to the available scheme options." },
  { q: "How many months do I need to pay?", a: "The scheme requires 11 monthly contributions." },
  { q: "What is the Lakshmi Kubera benefit?", a: "Upon successful completion of the required 11 monthly contributions, the applicable benefit is equivalent to one month's contribution, subject to the scheme terms." },
  { q: "Can you show an example?", a: (<>If you contribute ₹5,000 every month for 11 months:<br />₹5,000 × 11 = ₹55,000<br />Lakshmi Kubera Benefit = ₹5,000<br /><span className="font-medium text-dark">Total Jewellery Value = ₹60,000</span></>) },
  { q: "Can I choose any monthly amount?", a: "The available amounts are shown on this page. Custom contributions are permitted between ₹1,000 and ₹50,000." },
  { q: "When can I use my scheme value?", a: "After successful completion of the scheme, the accumulated value and applicable benefit can be used toward eligible jewellery purchases according to the scheme terms." },
  { q: "What happens if I miss a monthly contribution?", a: "Rules for missed, delayed or incomplete contributions are governed by the official scheme terms — please refer to them for the applicable conditions." },
];
