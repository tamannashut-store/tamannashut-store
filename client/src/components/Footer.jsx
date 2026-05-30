function Footer() {
    return (
      <footer className="bg-black text-white py-14 px-6">
  
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
  
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Tamanna's Hut
            </h2>
  
            <p className="text-gray-400">
              Premium kids fashion brand for modern and stylish little stars.
            </p>
          </div>
  
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Quick Links
            </h3>
  
            <div className="flex flex-col gap-2 text-gray-400">
  
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
  
            <p className="text-gray-400">
              Kolkata, India
            </p>
  
            <p className="text-gray-400">
              support@tamannashut.com
            </p>
          </div>
  
        </div>
  
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
          © 2026 Tamanna's Hut. All rights reserved.
        </div>
  
      </footer>
    );
  }
  
  export default Footer;