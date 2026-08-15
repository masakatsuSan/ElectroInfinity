import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#17171c] text-white pt-20 pb-28 border-t border-hairline/20">
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
        
        {/* Top: Coral Label & Headline */}
        <div className="mb-14 max-w-2xl">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-3">
            Engineering the Future
          </span>
          <h2 className="font-display font-medium text-[32px] md:text-[42px] leading-tight tracking-tight text-white">
            Electrical Engineering Club · AGEMC
          </h2>
          <p className="font-sans text-[15px] text-[#93939f] mt-2">
            Alipurduar Government Engineering & Management College.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-white/10">
          
          {/* Column 1 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">Department</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link to="/about" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Our Vision & Story</Link></li>
              <li><Link to="/faculty" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Faculty Directory</Link></li>
              <li><Link to="/laboratory" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Laboratories & Research</Link></li>
              <li><Link to="/achievements" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Student Achievements</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">Academics</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link to="/courses" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Course Syllabus</Link></li>
              <li><Link to="/resources" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Study Resources & Notes</Link></li>
              <li><Link to="/events" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Workshops & Events</Link></li>
              <li><Link to="/gallery" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Department Gallery</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">Portals</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link to="/attendance/student" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Student Attendance Scan</Link></li>
              <li><Link to="/attendance/faculty" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Faculty Attendance Console</Link></li>
              <li><Link to="/students" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Student Dashboard</Link></li>
              <li><Link to="/forum" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Discussion Forum</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">External</h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a href="https://agemc.ac.in/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors flex items-center gap-1.5">
                  AGEMC Official ↗
                </a>
              </li>
              <li>
                <a href="https://makautwb.ac.in/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors flex items-center gap-1.5">
                  MAKAUT Portal ↗
                </a>
              </li>
              <li><Link to="/contact" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Contact Department</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-sans text-[#93939f]">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Electro Infinity · AGEMC</span>
            <span className="text-white/20">|</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-green"></span>
            <span className="font-mono text-[12px] text-[#75758a]">Systems Online ⚡</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
