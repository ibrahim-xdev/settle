import { useState } from "react";

export default function InvoiceMockup() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex justify-center md:justify-end">
      <div
        className="settle-card relative w-[300px] bg-white rounded-[10px] border border-[#DEDACD] p-6 transition-[transform,box-shadow] duration-300 ease-out"
        style={{
          // pause the CSS float animation on hover so this inline transform
          // (rather than the keyframes) is what's actually shown
          animationPlayState: hovered ? "paused" : "running",
          transform: hovered ? "rotate(0deg) translateY(-4px)" : "rotate(3deg)",
          boxShadow: hovered
            ? "0 28px 48px -20px rgba(23,20,15,0.32)"
            : "0 20px 40px -20px rgba(23,20,15,0.25)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-[15px]">Ibrahim — Web dev</p>
            <p className="text-[11px] text-[#6E6A5E] mt-0.5">INV-0042</p>
          </div>
          <p className="text-[11px] text-[#6E6A5E]">Due Sep 20</p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#EDEAE1] space-y-2.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-[#6E6A5E]">West Construction Group</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-[#6E6A5E]">Landing page redesign</span>
            <span>$300.00</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EDEAE1] flex justify-between items-baseline">
          <span className="text-[11px] text-[#6E6A5E] uppercase tracking-wide">
            Total
          </span>
          <span className="font-display text-[20px]">$300.00</span>
        </div>

        {/* stamp */}
        <div
          className="settle-stamp absolute -right-5 -top-5 w-[74px] h-[74px] rounded-full border-2 border-[#96742B] flex items-center justify-center bg-[#F4F2ED]"
          style={{ transform: "rotate(-10deg)" }}
        >
          <span className="font-display text-[12px] tracking-wide text-[#96742B]">
            PAID
          </span>
        </div>
      </div>
    </div>
  );
}
