import { FaWhatsapp } from "react-icons/fa";

function WhatsAppButton() {

  return (

    <a
      href="https://wa.me/919874328578"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >

      <div className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-110">

        <FaWhatsapp className="text-4xl" />

      </div>

    </a>

  );
}

export default WhatsAppButton;