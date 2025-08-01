import PromptSuggestionButton from "./PromptSuggestionButton";

export default function PromptSuggestion({ onPromptClick }) {
  const prompts = ["Cu ce se ocupa compania c4sam ? "];

  return (
    <div className="prompt-suggestion">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          onClick={() => onPromptClick(prompt)}
          key={`suggestion-${index}`}
          text={prompt}
        />
      ))}
    </div>
  );
}
