/** Soft, dimensional pastel layers that echo the world's rounded platform shapes. */
export default function StackLogo({ className = "" }: { className?: string }) {
  const tile = "M7 11.5 22 3.6Q24 2.5 26 3.6L41 11.5Q43 12.5 41 13.6L26 21.5Q24 22.6 22 21.5L7 13.6Q5 12.5 7 11.5Z";
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {[
        { y: 18, face: "#bddbcf", edge: "#9bbfaf" },
        { y: 9, face: "#edc9dc", edge: "#d3a8c2" },
        { y: 0, face: "#d3c0ec", edge: "#b39acb" },
      ].map(({ y, face, edge }) => (
        <g key={y} transform={`translate(0 ${y})`}>
          <path d={tile} transform="translate(0 3)" fill={edge} />
          <path d={tile} fill={face} />
        </g>
      ))}
      <path d="m13 12.5 10-5.2q1-.5 2 0l4.5 2.3" stroke="#f9f2ff" strokeOpacity=".65" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
