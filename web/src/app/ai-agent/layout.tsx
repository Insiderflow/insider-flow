export default function AiAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
