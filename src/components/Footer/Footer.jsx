import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">ANITA</span>
              <span className="text-blue-300"> MOTORS</span>
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Your trusted automotive partner in Akola, providing quality vehicles and exceptional service since inception.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-blue-700 pb-2">Contact Details</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin size={18} className="mr-3 mt-0.5 flex-shrink-0 text-blue-300" />
                <address className="text-sm text-blue-100 not-italic">
                  Shop no 2, Rahate complex, Jawahar Nagar,<br />
                  Akola 444001
                </address>
              </div>
              <div className="flex items-center">
                <Phone size={18} className="mr-3 text-blue-300 flex-shrink-0" />
                <a href="tel:+918468857781" className="text-sm text-blue-100 hover:text-white">+91 8468857781</a>
              </div>
              <div className="flex items-center">
                <Mail size={18} className="mr-3 text-blue-300 flex-shrink-0" />
                <a href="mailto:contact@anitamotors.com" className="text-sm text-blue-100 hover:text-white">contact@anitamotors.com</a>
              </div>
              <div className="text-sm text-blue-100 mt-2">
                GSTIN: 27CSZPR0818J1ZX
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-blue-700 pb-2">Business Hours</h3>
            <div className="text-sm text-blue-100 space-y-2">
              <div className="flex justify-between">
                <span>Monday - Saturday:</span>
                <span>9:00 AM - 8:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Get Updates</h4>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-3 py-2 rounded-l-md bg-blue-800/50 border border-blue-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
                  aria-label="Email for newsletter subscription"
                />
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r-md transition-colors text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Credits */}
      <div className="bg-blue-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-blue-300">
            <div className="mb-2 md:mb-0 text-center md:text-left">
              &copy; {new Date().getFullYear()} Anita Motors. All rights reserved.
            </div>
            <div className="text-center md:text-right">
              <span>Designed & Developed by </span>
              <a href="https://webreich.com" className="font-semibold text-white hover:text-blue-200">
                WebReich Technologies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;