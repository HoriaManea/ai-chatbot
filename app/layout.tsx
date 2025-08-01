import { deflate } from "zlib";
import "./global.css";

export const metadata = {
  title: "c4samgpt",
  description: "The place to go for all c4sam questions!",
};

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
