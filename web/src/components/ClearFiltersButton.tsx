"use client";
import { useRouter } from "next/navigation";
import { actionStyles } from "@/components/actionStyles";

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
      className={actionStyles("secondary")}
      aria-label="Clear all filters"
      type="button"
    >
      清除篩選
    </button>
  );
}


