import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "./motionVariants";

const steps = [
  {
    n: "01",
    title: "Mark it done",
    body: "Fill in the client, the amount, and a due date. Ten seconds, one form.",
  },
  {
    n: "02",
    title: "It sends itself",
    body: "A clean PDF is generated and emailed to your client automatically — no drafting, no attaching.",
  },
  {
    n: "03",
    title: "It follows up",
    body: "If the due date passes unpaid, Settle sends a polite reminder on its own. You don't have to remember to chase it.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="max-w-6xl mx-auto px-6 md:px-10 py-20 border-t border-[#DEDACD] font-body"
    >
      <h2 className="font-display text-[26px] mb-12">
        Three steps, then you're gone.
      </h2>

      <motion.div
        className="grid md:grid-cols-3 gap-10"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {steps.map((step) => (
          <motion.div key={step.n} variants={fadeUpItem}>
            <span className="text-[13px] text-[#96742B] font-medium">
              {step.n}
            </span>
            <h3 className="font-display text-[18px] mt-3">{step.title}</h3>
            <p className="text-[14px] text-[#6E6A5E] mt-2 leading-[1.6] max-w-[260px]">
              {step.body}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
