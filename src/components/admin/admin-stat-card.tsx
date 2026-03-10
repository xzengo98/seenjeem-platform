type AdminStatCardProps = {
  label: string;
  value: string;
};

export default function AdminStatCard({
  label,
  value,
}: AdminStatCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">
        {value}
      </p>
    </div>
  );
}