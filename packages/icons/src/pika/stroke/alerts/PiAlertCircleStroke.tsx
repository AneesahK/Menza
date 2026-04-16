export function PiAlertCircleStroke(props: React.ComponentProps<"svg">) {
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
      <path d="M12 12.624v-4M12 16zm9-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
