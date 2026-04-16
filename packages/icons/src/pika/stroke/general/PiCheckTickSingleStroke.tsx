export function PiCheckTickSingleStroke(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m5.5 12.5 4.517 5.225.4-.701a28.6 28.6 0 0 1 8.7-9.42L20 7" />
    </svg>
  );
}
