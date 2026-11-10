import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import Footer from "@/components/ui/Footer";
import { Icon } from "@/components/ui/icons";
import SiteHeader from "@/components/ui/SiteHeader";

export default function RejectedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment font-ui text-umber">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-section md:px-gutter">
        <div className="w-full max-w-narrow rounded-control bg-vellum px-6 py-8 text-center shadow-hairline md:px-8">
          <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-bone text-umber-soft">
            <Icon name="x" size={20} />
          </div>

          <p className="mb-3 font-mono text-label uppercase text-umber-soft">Application reviewed</p>

          <h1 className="mb-5 font-serif text-section text-umber">Not right now</h1>

          <div className="mb-8 space-y-4 text-left font-serif text-reading text-umber-soft">
            <p>
              Thanks for your interest in Tell The World. After reviewing your
              application, we&rsquo;re not able to offer you a place at this
              time.
            </p>
            <p>
              This doesn&rsquo;t mean your work isn&rsquo;t valuable. The
              platform is still small and we&rsquo;re being selective about who
              joins in this early stage.
            </p>
            <p>
              You&rsquo;re welcome to reapply in the future as the platform
              grows and the community expands.
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
