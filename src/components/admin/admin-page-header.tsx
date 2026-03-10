import { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cyan-300">إدارة المحتوى</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </div>
  );
}