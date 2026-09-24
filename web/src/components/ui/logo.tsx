import React from "react";

export function LogoIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M438.169 152.95L479 192.714V316.193L440.263 355.957L395.244 402H116.756L33 318.286V109H394.197L438.169 152.95ZM257.047 161.321V347.586H371.164L400.479 319.332L426.653 293.171V215.736L372.211 161.321H257.047Z"
        fill="currentColor"
      />
    </svg>
  );
}
