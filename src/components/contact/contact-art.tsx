/**
 * Decorative inline SVGs for the contact page. Everything here is aria-hidden
 * background art — no raster assets, so nothing needs the SafeImage wrapper.
 */

export function PlaneWatermark(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={props.className}
      fill="currentColor"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M256 36c7 0 12 16 13 48l1 92 198 88v28l-198-52-2 116 50 44v20l-56-18c-2 8-10 8-12 0l-56 18v-20l50-44-2-116-198 52v-28l198-88 1-92c1-32 6-48 13-48Z" />
    </svg>
  )
}

export function MapLines(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={props.className}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 1200 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M-20 120C180 90 320 200 560 170s420-80 680-30" />
      <path d="M-20 320c260-20 440 100 720 60s360-80 520-20" />
      <path d="M-20 480c220 10 420-60 640-20s400 80 600 20" />
      <path d="M200-20c30 160-40 340 60 640" />
      <path d="M620-20c-20 180 80 320 20 640" />
      <path d="M960-20c-20 200 60 360 20 640" />
      <path d="M340 620 620 250l240-180" opacity="0.6" />
      <rect height="46" opacity="0.5" width="72" x="420" y="230" />
      <rect height="34" opacity="0.5" width="52" x="760" y="330" />
      <rect height="40" opacity="0.5" width="60" x="1020" y="150" />
    </svg>
  )
}

export function MapPin() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C7.9 2 4.5 5.4 4.5 9.5 4.5 15.1 12 22 12 22s7.5-6.9 7.5-12.5C19.5 5.4 16.1 2 12 2Z"
        fill="currentColor"
      />
      <circle cx="12" cy="9.5" fill="#ffffff" r="3.2" />
    </svg>
  )
}
