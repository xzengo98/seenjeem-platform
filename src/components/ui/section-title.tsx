type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  centered = true,
}: SectionTitleProps) {
  return (
    <div className={centered ? "mb-10 text-center" : "mb-10"}>
      {eyebrow ? <div className="text-sm font-bold text-cyan-300">{eyebrow}</div> : null}

      <h2 className="mt-3 text-4xl font-black">{title}</h2>

      {description ? (
        <p
          className={`mt-4 text-lg text-slate-300 ${
            centered ? "mx-auto max-w-3xl" : "max-w-3xl"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}