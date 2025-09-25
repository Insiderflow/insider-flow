"use client";
import { useRouter } from "next/navigation";

type Props = {
  formId: string;
};

export default function ClearFiltersButton({ formId }: Props) {
  const router = useRouter();

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) form.reset();
    router.replace("/trades");
  }

  return (
    <button
      onClick={onClick}
      className="inline-block bg-white text-[#007BFF] border border-[#007BFF] px-3 py-1 rounded text-sm hover:bg-[#007BFF] hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
      aria-label="Clear all filters"
      type="button"
    >
      清除篩選
    </button>
  );
}


