import InvoiceMockup from "./InvoiceMockup";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 grid md:grid-cols-2 gap-16 items-center font-body">
      <div>
        <h1 className="settle-1 font-display text-[42px] md:text-[54px] leading-[1.08] tracking-tight">
          The invoice goes out the moment the work is done.
        </h1>

        <p className="settle-2 mt-6 text-[17px] leading-[1.6] text-[#6E6A5E] max-w-[440px]">
          Mark a project complete and Settle drafts the PDF, emails your client,
          and follows up on its own if the payment's late. One form, nothing
          else to remember.
        </p>

        <div className="settle-3 mt-9 flex items-center gap-4">
          <Link
            to="/signup"
            className="px-5 py-3 rounded-[6px] bg-[#17140F] text-[#F4F2ED] text-[14px] font-medium hover:bg-[#2B2621] transition-all active:scale-[0.97]"
          >
            Start for free
          </Link>
          <a
            href="#how"
            className="group text-[14px] font-medium text-[#17140F] flex items-center gap-1.5 hover:text-[#96742B] transition-colors"
          >
            See how it works
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <p className="settle-4 mt-9 text-[13px] text-[#6E6A5E]">
          No card required. Built for freelancers who'd rather not think about
          billing.
        </p>
      </div>

      <InvoiceMockup />
    </section>
  );
}
