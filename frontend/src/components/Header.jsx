import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="max-w-6xl mx-auto px-6 md:px-10 pt-7 flex items-center justify-between font-body">
      <span className="font-display text-[20px] tracking-tight">Settle</span>

      <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#6E6A5E]">
        <a href="#how" className="relative group hover:text-[#17140F] transition-colors">
          How it works
          <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#17140F] transition-all duration-300 group-hover:w-full" />
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-[14px] font-medium px-4 py-2 text-[#17140F] hover:text-[#6E6A5E] transition-all active:scale-[0.97]"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="text-[14px] font-medium px-4 py-2 rounded-[6px] bg-[#17140F] text-[#F4F2ED] hover:bg-[#2B2621] transition-all active:scale-[0.97]"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
