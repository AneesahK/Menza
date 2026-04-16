export function PiMultipleCrossCancelDefaultStroke(
  props: React.ComponentProps<"svg">,
) {
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
      <path d="m6 18 6-6m0 0 6-6m-6 6L6 6m6 6 6 6" />
    </svg>
  );
}
