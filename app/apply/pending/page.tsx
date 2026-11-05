import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import Footer from "@/components/ui/Footer";
import { Icon } from "@/components/ui/icons";
import SiteHeader from "@/components/ui/SiteHeader";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment font-ui text-umber">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-section md:px-gutter">
        <div className="w-full max-w-narrow rounded-control bg-vellum px-6 py-8 text-center shadow-hairline md:px-8">
          <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-bone text-umber">
            <Icon name="check" size={20} />
          </div>

          <p className="mb-3 font-mono text-label uppercase text-umber-soft">Application received</p>

          <h1 className="mb-5 font-serif text-section text-umber">You&rsquo;re in the queue</h1>

          <div className="mb-8 space-y-4 font-serif text-reading text-umber-soft">
            <p>Thanks for applying!</p>
            <p>
              Every application is reviewed personally. You&rsquo;ll hear back
              within a few days.
            </p>
          </div>

          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
