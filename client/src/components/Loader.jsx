export default function Loader({ text }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse text-teal-600 font-semibold">{text}</div>
    </div>
  );
}
