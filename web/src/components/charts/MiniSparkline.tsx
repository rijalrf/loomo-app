interface MiniSparklineProps {
  data: number[];
  color: string;
}

export default function MiniSparkline({ data, color }: MiniSparklineProps) {
  return (
    <svg width="40" height="20" className="opacity-80">
      {data.map((val, idx) => {
        const height = (val / 10) * 16 + 4;
        const x = idx * 5;
        const y = 20 - height;
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width="3"
            height={height}
            fill={color}
            rx="1.5"
          />
        );
      })}
    </svg>
  );
}
