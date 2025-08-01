"use client";

import Image from "next/image";
// import c4sam from "./assets/c4sam_photo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";
import PromptSuggestion from "./components/PromptSuggestion";

export default function Home() {
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat();
  const noMessages = !messages || messages.length === 0;

  function onPromptClick(promptText) {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  }

  return (
    <main>
      {/* <Image src={c4sam} width="250" alt="F1GPT Logo" /> */}
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The perfect place to ask questions about the company C4SAM!
            </p>
            <br />
            <PromptSuggestion onPromptClick={onPromptClick} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something..."
        />
        <input type="submit" />
      </form>
    </main>
  );
}
