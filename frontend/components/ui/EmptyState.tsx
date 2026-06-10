import { ReactNode } from "react";
import Link from "next/link";
import Button from "./Button";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {icon && (
        <div className="w-20 h-20 rounded-full bg-gold-bg flex items-center justify-center text-gold mb-6">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-2xl text-dark mb-2">{title}</h3>
      {description && (
        <p className="text-gray max-w-md mb-6">{description}</p>
      )}
      <div className="w-16 h-[2px] bg-gold mb-6" />
      {actionLabel &&
        (actionHref ? (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        ))}
    </div>
  );
}
