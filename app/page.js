"use client";  // Add this at the very top of the file

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { marked } from "marked";
import parse from "html-react-parser";

export default function Home() {
  const messageRef = useRef();
  const [messages, setMessages] = useState([]);
  const [displayedMessage, setDisplayedMessage] = useState("Hello human!");
  const [loading, setLoading] = useState(false);

  // Reference for the bottom of the message list
  const bottomRef = useRef(null);

  // Scroll to bottom when messages are updated
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = messageRef.current.value;
    setLoading(true);

    let newMessageList = [
      ...messages,
      {
        role: "user",
        content: prompt,
      },
    ];

    try {
      const response = await fetch("/api/bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({ messages: newMessageList }),  // Send entire message list
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Check if the response is valid and add it
      if (data.response) {
        newMessageList.push({
          role: data.response.role,
          content: data.response.content, // Handle the single response object
        });

        setMessages(newMessageList);
        setDisplayedMessage(data.response.content || ""); // Set the single response to displayedMessage
      } else {
        console.error("No valid response received from assistant.");
      }

      messageRef.current.value = "";
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="container mx-auto max-w-4xl">
      <div className="grid grid-cols-5">
        <div
          className={`bg-green-400 col-span-4 relative py-4 px-4 flex flex-col justify-center ${
            loading ? "animate-pulse" : ""
          }`}
        >
          <div className="absolute h-[15px] w-[15px] bg-green-400 -right-[7px] top-[7%] rotate-45"></div>
          <h3 className="text-2xl text-white font-bold">Ele says:</h3>
          <div className="text-white">
          {loading ? "I am preparing your answer.." : parse(marked(displayedMessage || ""))}

          </div>
        </div>

        <div>
          <Image
            priority
            src="/robopic.png"
            width={300}
            height={300}
            alt="robot"
          />
        </div>
      </div>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <label className="font-bold">Ask me something...</label>
          <input
            className="px-5 py-2 text-gray-700 placeholder-gray-500 bg-white border-gray-700 rounded-lg"
            required
            type="text"
            placeholder="Type your question"
            ref={messageRef}
          ></input>
        </div>
        <button
          type="submit"
          className="px-4 py-2 mt-2 text-black-700 bg-blue border border-red-700 rounded-lg hover:scale-110 transition-all duration-200"
        >
          Send message
        </button>
      </form>

      <div className="mt-6 h-[400px] overflow-y-scroll">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 py-2 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Message Section */}
            {message.role === "user" ? (
              <>
                <div className="w-[90%] text-right">
                  <p className="text-black bg-blue-500 text-white p-3 rounded-lg inline-block">
                    <strong>You: </strong>
                    {message.content}
                  </p>
                </div>
                <div className="w-[50px]">
                  <Image
                    src="/user.png" // Add your user avatar image
                    width={50}
                    height={50}
                    alt="User"
                    className="rounded-full"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-[50px]">
                  <Image
                    src="/robot.png" // Add your bot avatar image
                    width={50}
                    height={50}
                    alt="Bot"
                    className="rounded-full"
                  />
                </div>
                <div className="w-[90%] text-left">
                  <p className="text-black bg-gray-300 p-3 rounded-lg inline-block">
                    <strong>Ele: </strong>
                    {message.content}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
        {/* Ref element to automatically scroll to */}
        <div ref={bottomRef} />
      </div>
    </main>
  );
}
