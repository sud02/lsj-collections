import { ReactNode } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";

interface Props {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}

export default function PolicyLayout({ title, subtitle, lastUpdated, children }: Props) {
  return (
    <div className="bg-cream min-h-screen">
      <div className="container-lsj py-6">
        <Breadcrumb items={[{ label: title }]} />

        <div className="mt-2 mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Legal &amp; Policies</p>
          <h1 className="font-serif text-3xl md:text-4xl text-dark mt-1">{title}</h1>
          <div className="w-16 h-[2px] bg-gold mx-auto mt-3" />
          {subtitle && (
            <p className="text-sm text-gray mt-3 max-w-2xl mx-auto">{subtitle}</p>
          )}
          {lastUpdated && (
            <p className="text-xs text-gray mt-2">Last updated: {lastUpdated}</p>
          )}
        </div>

        <article className="max-w-3xl mx-auto bg-white border border-border rounded-lg p-6 md:p-10">
          <div className="prose prose-sm md:prose-base max-w-none text-gray
            prose-headings:font-serif prose-headings:text-dark prose-headings:mt-8 prose-headings:mb-3
            prose-h2:text-xl prose-h2:border-l-2 prose-h2:border-gold prose-h2:pl-3
            prose-p:leading-relaxed prose-li:my-1 prose-strong:text-dark
            prose-a:text-gold hover:prose-a:text-gold-dark">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
