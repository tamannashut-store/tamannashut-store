import { useEffect, useState } from "react";
import axios from "axios";

function AdminContacts() {

  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {

    try {

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contacts`
      );

      setContacts(data);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      <h1 className="text-4xl font-bold mb-8">
        Contact Messages
      </h1>

      <div className="overflow-x-auto">

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-100">

              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Message</th>
              <th className="p-3 border">Date</th>

            </tr>

          </thead>

          <tbody>

            {contacts.map((contact) => (

              <tr key={contact._id}>

                <td className="border p-3">
                  {contact.name}
                </td>

                <td className="border p-3">
                  {contact.email}
                </td>

                <td className="border p-3">
                  {contact.message}
                </td>

                <td className="border p-3">
                  {new Date(
                    contact.createdAt
                  ).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default AdminContacts;