import { Link } from "react-router-dom";
function Footer() {
    return (
      <footer className="bg-[#355E3B] text-white py-14 px-6">
  
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-10">
  
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Tamanna's Hut
            </h2>
  
            <p className="text-white">
              Premium kids fashion brand for modern and stylish little stars.
            </p>
          </div>
  
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Quick Links
            </h3>
  
            <div className="flex flex-col gap-2 text-white">
  
              <a href="/">Home</a>
              <a href="/">Girls Collection</a>
              <a href="/">Boys Collection</a>
              <a href="/">New Arrivals</a>
  
            </div>
          </div>
    
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Contact
            </h3>
  
            <p className="text-white">
              Kolkata, India
            </p>
  
            <p className="text-white">
              support@tamannashut.com
            </p>
          </div>
  
        </div>
        <div>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <Link to="/return-policy" className="text-white hover:text-white">Return Policy</Link>
            <Link to="/shipping-policy" className="text-white hover:text-white">Shipping Policy</Link>
            <Link to="/privacy-policy" className="text-white hover:text-white">Privacy Policy</Link>
            <Link to="/terms-conditions" className="text-white hover:text-white">Terms Conditions</Link>
            <Link to="/contact" className="text-white hover:text-white">Contact Us</Link>
          </div>
          </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-white">
          © 2026 <a href="/">Tamanna's Hut</a>. All rights reserved.
        </div>
  
      </footer>
    );
  }
  
  export default Footer;