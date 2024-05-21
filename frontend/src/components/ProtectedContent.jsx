import { useState, useEffect } from "react";

export const ProtectedContent = () => {
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/protected", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("You need to be logged in to see this content");
        }

        const data = await response.json();
        setContent(data.message);
      } catch (error) {
        setContent(error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Protected Content</h2>
      <p>{content}</p>
    </div>
  );
};
