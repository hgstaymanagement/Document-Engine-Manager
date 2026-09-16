export default function Seal({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" stroke="#A87C2E" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="15.5" stroke="#1F3D2B" strokeWidth="1" />
      <path
        d="M20 10 L23.5 17 L31 17.8 L25.5 22.8 L27.2 30 L20 26.1 L12.8 30 L14.5 22.8 L9 17.8 L16.5 17 Z"
        fill="#1F3D2B"
      />
      <circle cx="20" cy="20" r="4.2" fill="#F7F5EE" stroke="#A87C2E" strokeWidth="0.8" />
    </svg>
  )
}
