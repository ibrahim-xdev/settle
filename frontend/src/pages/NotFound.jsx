import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="min-h-screen flex flex-col items-center justify-center bg-[#F4F2ED] text-[#17140F] font-sans"
    >
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-[#6E6A5E] mb-6">That page doesn't exist.</p>
      <Link
        to="/"
        className="text-[14px] font-medium underline transition-all hover:text-[#96742B] active:scale-95 inline-block"
      >
        Back to home
      </Link>
    </motion.div>
  );
}
