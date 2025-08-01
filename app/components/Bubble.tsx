export default function Bubble({ message }) {
  const { content, role } = message;

  return <div className={`${role} bubble`}>{content}</div>;
}
