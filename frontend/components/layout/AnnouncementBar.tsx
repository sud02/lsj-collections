const messages = [
  "Free shipping on orders above ₹5,000",
  "Certified Hallmark Jewelry",
  "Easy Returns within 15 days",
];

export default function AnnouncementBar() {
  const text = messages.join("  •  ");
  return (
    <div className="bg-gold text-white text-xs overflow-hidden border-b border-gold-dark">
      <div className="relative flex whitespace-nowrap">
        <div className="flex animate-marquee py-2.5">
          <span className="px-8 tracking-wide">{text}</span>
          <span className="px-8 tracking-wide">{text}</span>
          <span className="px-8 tracking-wide">{text}</span>
          <span className="px-8 tracking-wide">{text}</span>
        </div>
      </div>
    </div>
  );
}
