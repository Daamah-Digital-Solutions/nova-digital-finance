import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Nova Digital Finance"
            width={80}
            height={80}
            className="h-20 w-20 object-contain brightness-0 invert"
          />
        </Link>

        <div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            Interest-Free Financing in Pronova (PRN)
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
