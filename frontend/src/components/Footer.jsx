import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer data-nav-theme="dark" className="bg-[#141413] text-white pt-24 pb-36">
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
        
        {/* Large Conversational Headline */}
        <div className="mb-16 max-w-2xl">
          <h2 className="font-display font-medium text-[36px] md:text-[44px] leading-tight tracking-[-0.02em] text-white">
            We're always here to power your journey forward.
          </h2>
        </div>

        {/* 4-Column Link Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16">
          
          {/* Column 1 */}
          <div>
            <h4 className="font-sans text-[12px] md:text-[14px] font-bold text-[#696969] uppercase tracking-[0.04em] mb-6">About Us</h4>
            <ul className="flex flex-col gap-5">
              <li><Link to="/about" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Our Story</Link></li>
              <li><Link to="/faculty" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Faculty Directory</Link></li>
              <li><Link to="/laboratory" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Laboratories & Facilities</Link></li>
              <li><Link to="/achievements" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Achievements</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-sans text-[12px] md:text-[14px] font-bold text-[#696969] uppercase tracking-[0.04em] mb-6">Academics</h4>
            <ul className="flex flex-col gap-5">
              <li><Link to="/courses" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Courses</Link></li>
              <li><Link to="/resources" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Resources & Notes</Link></li>
              <li><Link to="/events" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Upcoming Events</Link></li>
              <li><Link to="/gallery" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors">Photo Gallery</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-sans text-[12px] md:text-[14px] font-bold text-[#696969] uppercase tracking-[0.04em] mb-6">Need Help?</h4>
            <ul className="flex flex-col gap-5">
              <li>
                <Link to="/contact" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/placements" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Placement Cell
                </Link>
              </li>
              <li>
                <Link to="/faq" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-sans text-[12px] md:text-[14px] font-bold text-[#696969] uppercase tracking-[0.04em] mb-6">Portals</h4>
            <ul className="flex flex-col gap-5">
              <li>
                <Link to="/login" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center">
                  Student Login 
                  <svg className="ml-1 opacity-70" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </Link>
              </li>
              <li>
                <a href="https://agemc.ac.in/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center">
                  AGEMC Official 
                  <svg className="ml-1 opacity-70" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>
              </li>
              <li>
                <a href="https://makautwb.ac.in/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] font-[450] text-white hover:text-white/80 transition-colors flex items-center">
                  MAKAUT 
                  <svg className="ml-1 opacity-70" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Row - Divider & Legal */}
        <div className="pt-8 border-t border-white/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[12px] text-white">© {new Date().getFullYear()} Electro Infinity</span>
            <span className="text-white/30">|</span>
            <Link to="/privacy" className="font-sans text-[12px] text-white hover:underline">Privacy</Link>
            <Link to="/terms" className="font-sans text-[12px] text-white hover:underline">Terms</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Country Selector Pill placeholder */}
            <div className="flex items-center gap-2 bg-transparent border border-white/40 rounded-[999px] px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="font-sans text-[12px] text-white">India / English</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            
            {/* Social Icons */}
            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
