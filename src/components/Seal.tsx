export default function Seal({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Municipality of Bulan seal"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain shrink-0"
    />
  )
}
