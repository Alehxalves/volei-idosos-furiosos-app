"use client";

import { motion } from "framer-motion";
import { Volleyball } from "../Landing";

export function AdminLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 font-bold"
    >
      <Volleyball size={28} spin />
      <span className="tracking-tight">
        IDOSOS <span className="text-accent">&</span> FURIOSOS
      </span>
    </motion.div>
  );
}
