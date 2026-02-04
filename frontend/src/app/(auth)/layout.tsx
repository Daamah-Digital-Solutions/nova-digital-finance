import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <span className="text-xl font-bold text-white">
            Nova Digital Finance
          </span>
        </Link>

        <div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            Interest-Free Financing in BroNova (PRN)
          </h2>
          <p className="text-lg text-white/70">
            Access cryptocurrency financing with only 3-5% processing fee.
            No interest. Flexible repayment. Invest through CapiMax.
          </p>
        </div>

        <p className="text-sm text-white/50">
          &copy; {new Date().getFullYear()} Nova Digital Finance
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
