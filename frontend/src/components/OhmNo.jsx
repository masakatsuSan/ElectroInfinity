import React from 'react'
import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function OhmNo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-32 pb-20 text-center page-wrap">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative mb-8"
      >
        <motion.svg
          width="160"
          height="160"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-primary opacity-80"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16.8 9.2c.5-1.1.8-2.4.8-3.7A5.5 5.5 0 0 0 12 0c-1.3 0-2.6.3-3.7.8" />
          <path d="m2 2 20 20" />
          <path d="M6.3 6.3c-.9 1.4-1.3 3.1-1.3 4.7 0 2.8 1.9 4 3 5v2c0 1.1.9 2 2 2h4c.7 0 1.3-.3 1.7-.8" />
          <path d="M10 22h4" />
        </motion.svg>

        <motion.circle
          cx="4"
          cy="4"
          r="1.5"
          fill="currentColor"
          className="absolute top-0 left-0 text-red-500"
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        />
        <motion.circle
          cx="20"
          cy="8"
          r="1"
          fill="currentColor"
          className="absolute right-0 text-yellow-500 top-4"
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        />
        <motion.circle
          cx="18"
          cy="20"
          r="2"
          fill="currentColor"
          className="absolute bottom-0 text-primary right-2"
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }}
        />
      </motion.div>

      <h1 className="font-display text-[56px] leading-none tracking-tight mb-6 text-ink">
        404 — Ohm No! <Zap size={20} className="inline-block align-text-bottom" />
      </h1>

      <div className="text-body-muted text-[17px] max-w-md mx-auto space-y-4 mb-10">
        <p>This page has officially resisted existence.</p>
        <p>
          The voltage is missing,<br />
          the current refuses to flow,<br />
          and Kirchhoff is asking questions.
        </p>
        <p>Probably best to head back before the circuit explodes.</p>
      </div>

      <Link to="/" className="inline-flex items-center gap-2 button-primary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Take Me Back
      </Link>
    </div>
  )
}
