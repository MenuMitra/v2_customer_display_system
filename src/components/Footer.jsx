import React from "react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <div className="mt-2 border-t border-gray-200 p-2 text-center">
      <div className="h-0.5" />
      <div className="mt-2.5 mb-2.5 flex items-center justify-center gap-[30px]">
        <a
          href="https://www.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#55a845] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#4285F4]"
          aria-label="Google"
        >
          <i className="ri-google-fill" />
        </a>
        <a
          href="https://www.facebook.com/people/Menu-Mitra/61565082412478/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#3388ff] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#1877F2]"
          aria-label="Facebook"
        >
          <i className="ri-facebook-fill" />
        </a>
        <a
          href="https://www.instagram.com/menumitra/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#e33161] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#E4405F]"
          aria-label="Instagram"
        >
          <i className="ri-instagram-fill" />
        </a>
        <a
          href="https://www.youtube.com/@menumitra"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-gray-200 bg-[#f8f9fa] text-[2.4rem] text-[#ee2329] transition-transform duration-150 hover:-translate-y-0.5 hover:text-[#FF0000]"
          aria-label="YouTube"
        >
          <i className="ri-youtube-fill" />
        </a>
      </div>
      <div className="mt-[1px] mb-2 flex items-center justify-center gap-2 text-xs text-[#757c8a]">
        <span className="font-medium">Version 2.0</span>
        <span className="mx-[3px]">|</span>
        <span className="font-normal">23 Sep 2025</span>
      </div>
    </div>
  );
};

export default Footer;
