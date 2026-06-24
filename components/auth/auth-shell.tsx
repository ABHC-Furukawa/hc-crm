export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-4">
        {children}
        {footer}
      </div>
    </div>
  );
}
