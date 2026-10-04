import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, ExternalLink, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isHiddenRoute } from './nav/navConfig'
import {
  FOOTER_COLUMNS,
  QUICK_LINKS,
  SOCIAL_LINKS,
  AGEMC_URL,
} from '../data/footerLinks'
import { BRAND_NAME } from '../config/brand'
import BrandLogo from './BrandLogo'

// Notched top edge for the tinted panel. The clip-path lives on the background
// layer only (an absolutely-positioned div), never on the footer itself, so the
// header / link content is never clipped. Left portion sits at the top, then
// steps down ~48px to a lower top edge for the rest of the width.
const NOTCH_CLIP = 'polygon(0 0, 45% 0, 49% 48px, 100% 48px, 100% 100%, 0 100%)'

function FooterGroup({ heading, links }) {
  return (
    <div>
      <h3 className="font-sans text-[15px] font-semibold text-ink mb-4">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="font-sans text-[14px] text-muted no-underline transition-colors duration-200 hover:text-primary hover:underline underline-offset-[3px] focus:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterColumn({ groups, gapClass = 'gap-[28px]' }) {
  return (
    <div className={`flex flex-col ${gapClass}`}>
      {groups.map((group) => (
        <FooterGroup key={group.heading} heading={group.heading} links={group.links} />
      ))}
    </div>
  )
}

function SocialRow() {
  const active = SOCIAL_LINKS.filter((l) => l.href)
  if (active.length === 0) return null
  return (
    <div className="flex items-center gap-3">
      {active.map((link) => {
        const Icon = link.Icon
        return (
          <a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink text-[20px] hover:text-primary hover:bg-surface-soft focus:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-colors"
        >
          {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden="true" />}
        </a>
        )
      })}
    </div>
  )
}

function CTAColumn() {
  return (
    <div className="flex flex-col">
      {/* Big heading + tilted "Open to all" pill */}
      <div className="flex items-end gap-3">
        <h3 className="text-2xl font-medium leading-tight font-display text-primary">
          Join the<br />Community
        </h3>
        <span
          className="inline-block transform rotate-[-12deg] bg-signature-mustard text-ink font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full"
          aria-label="Open to all"
        >
          Open to all
        </span>
      </div>

      <p className="mt-3 font-sans text-sm text-muted">
        Stay updated —{' '}
        <Link
          to="/announcements"
          className="text-muted no-underline hover:text-primary hover:underline underline-offset-[3px] focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          follow announcements
        </Link>
        {' '}for events, placements and department news.
      </p>

      {/* dashed divider under the CTA intro */}
      <div className="h-px my-5 border-t border-dashed border-primary/20" />

      {/* two big link rows with diagonal arrow */}
      <div className="flex flex-col">
        <Link
          to="/contact"
          className="group flex items-center justify-between py-3 text-[15px] font-semibold text-ink no-underline hover:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <span>Contact Us</span>
          <ArrowUpRight
            size={20}
            strokeWidth={1.75}
            className="transition-colors text-muted group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>
        <Link
          to="/projects"
          className="group flex items-center justify-between py-3 text-[15px] font-semibold text-ink no-underline hover:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <span>Share Your Project</span>
          <ArrowUpRight
            size={20}
            strokeWidth={1.75}
            className="transition-colors text-muted group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  )
}

export default function Footer() {
  const location = useLocation()
  const { user } = useAuth()
  const year = new Date().getFullYear()

  if (isHiddenRoute(location.pathname)) return null

  const quickLinks = user ? QUICK_LINKS.authenticated : QUICK_LINKS.unauthenticated

  return (
    <footer
      role="contentinfo"
      view-transition-name="footer"
      className="relative flex flex-col w-full isolate text-body"
    >
      {/* Tinted panel with the notched top edge — background layer only, behind
          content, so links are never clipped. */}
      <div className="absolute inset-0 -z-10 bg-surface-soft" style={{ clipPath: NOTCH_CLIP }} />

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-4 md:px-6">
        {/* Header row: logo+tagline column (left, at the high top-left) — social (right) */}
        <div className="flex items-end justify-between pt-10 pb-6">
          <div className="flex flex-col items-start">
            <BrandLogo variant="large" />
            <span className="flex items-center gap-1 mt-1 text-muted">
              <span className="font-sans text-sm">Built with</span>
              <Heart size={16} className="text-signature-coral" fill="currentColor" aria-hidden="true" />
              <span className="font-sans text-sm">at AGEMC</span>
            </span>
          </div>
          <SocialRow />
        </div>

        {/* dashed divider under the header row */}
        <div className="border-t border-dashed border-primary/20" />

        {/* Link area: 3 link columns + CTA column */}
        <div className="grid grid-cols-1 pt-10 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn groups={FOOTER_COLUMNS[0]} />
          <FooterColumn groups={FOOTER_COLUMNS[1]} />
          <FooterColumn groups={[{ heading: 'Quick Links', links: quickLinks }]} />
          <CTAColumn />
        </div>
      </div>

      {/* Preserved disclaimer (condensed from the previous "Unofficial & Independent Project"
          callout so nothing is dropped, while keeping the Unstop-style clean layout). */}
      <div className="mt-8 border-t border-hairline">
        <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-4">
          <p className="font-sans text-[12px] leading-[1.6] text-muted">
            {BRAND_NAME} is an independent, unofficial, open-source student project built
            by the Electrical Engineering seniors for their juniors. It is{' '}
            <strong className="font-semibold text-body">
              not affiliated with, endorsed by, or operated by
            </strong>{' '}
            Alipurduar Government Engineering &amp; Management College (AGEMC), its department,
            faculty, or any official college body — always confirm anything important with the
            college at{' '}
            <a
              href={AGEMC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            >
              agemc.ac.in
            </a>
            {' · '}Open source (MIT licensed).
          </p>
        </div>
      </div>

      {/* Bottom bar: thin solid divider, copyright left + AGEMC Official right */}
      <div className="border-t border-hairline">
        <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 flex flex-col items-center justify-between gap-3 py-4 text-[13px] font-sans text-muted sm:flex-row">
          <span>© {year} {BRAND_NAME}</span>
          <a
            href={AGEMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          >
            AGEMC Official
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
