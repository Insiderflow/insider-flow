/** Wider than root max-w-6xl so the 12-column insider table fits on desktop without horizontal scroll. */
export default function InsiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 max-w-[100vw]">
      <div className="mx-auto w-full max-w-[96rem] px-2 sm:px-4 lg:px-6">{children}</div>
    </div>
  );
}
