import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#17171c] text-white pt-20 pb-28 border-t border-hairline/20">
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
        
        {/* Top: Coral Label & Headline */}
        <div className="max-w-2xl mb-14">
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
        <div className="grid grid-cols-1 gap-10 border-b sm:grid-cols-2 lg:grid-cols-4 pb-14 border-white/10">
          
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
              <li><Link to="/announcements" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Announcements</Link></li>
              <li><Link to="/calendar" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Academic Calendar</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">Community</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link to="/forum" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Discussion Forum</Link></li>
              <li><Link to="/projects" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Student Projects</Link></li>
              <li><Link to="/announcements" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Official Announcements</Link></li>
              <li><Link to="/gallery" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors">Department Gallery</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-mono text-[12px] font-bold text-[#75758a] uppercase tracking-wider mb-5">External</h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a href="https://agemc.ac.in/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors flex items-center gap-1.5">
                  AGEMC Official <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://makaut1.ucanapply.com/smartexam/public/" target="_blank" rel="noopener noreferrer" className="font-sans text-[14px] text-[#93939f] hover:text-white transition-colors flex items-center gap-1.5">
                  MAKAUT Portal <ExternalLink size={14} />
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

        </div>

      </div>
    </footer>
  );
}
