export function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="hp-skeleton" style={{ height: 80 }} />
      <div className="hp-skeleton" style={{ height: 160 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="hp-skeleton" style={{ height: 110 }} />
        ))}
      </div>
    </div>
  );
}
