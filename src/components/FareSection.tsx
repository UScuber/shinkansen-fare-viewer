type Props = {
  title: string;
  note?: string;
  children: React.ReactNode;
};

function FareSection({ title, note, children }: Props) {
  return (
    <section className="fare-section">
      <h3 className="fare-section__title">{title}</h3>
      {children}
      {note && <p className="fare-section__note">{note}</p>}
    </section>
  );
}

export default FareSection;
