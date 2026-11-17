import type { MatrixCell } from "@/lib/brain/matrixGenerator";

type MatrixTileProps = {
  cell: MatrixCell;
  className?: string;
};

export default function MatrixTile({ cell, className = "" }: MatrixTileProps) {
  const description = cell.layers.map((layer) => `${layer.filled ? "filled" : "outline"} ${layer.shape}`).join(" inside ");
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={description} className={className}>
      {cell.layers.map((layer, index) => {
        const transform = `translate(50 50) scale(${layer.scale}) translate(-50 -50)`;
        const fill = layer.filled ? "currentColor" : "none";
        return (
          <g key={`${layer.shape}-${index}`} transform={transform} fill={fill} stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round">
            {layer.shape === "circle" && <circle cx="50" cy="50" r="37" />}
            {layer.shape === "square" && <rect x="13" y="13" width="74" height="74" />}
            {layer.shape === "triangle" && <path d="M50 10 L91 86 H9 Z" />}
            {layer.shape === "diamond" && <path d="M50 8 L92 50 L50 92 L8 50 Z" />}
          </g>
        );
      })}
    </svg>
  );
}
