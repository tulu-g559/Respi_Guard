import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    // Outer container: Fills the screen, centers content.
    // We assume the background image is set on the <body> or a parent wrapper.
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glassmorphism Card */}
      <div className="max-w-lg w-full text-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 shadow-2xl">
        {/* Large 404 Heading with a gradient or subtle transparency */}
        <h1 className="text-9xl font-extrabold text-white tracking-widest opacity-90 drop-shadow-md">
          404
        </h1>

        {/* Floating Message */}
        <div className="bg-white/20 px-2 text-sm rounded rotate-12 absolute top-20 right-14 backdrop-blur-sm hidden sm:block">
          Page Not Found
        </div>

        <h2 className="text-3xl font-bold text-white mt-4 mb-2">
          Oops! Lost in Space?
        </h2>

        <p className="text-lg text-teal-900 font-bold mb-8 ">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Action Button */}
        <Link
          to="/"
          className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white transition-all duration-200 bg-teal-600 rounded-full hover:bg-teal-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 focus:ring-offset-transparent"
        >
          {/* Icon (Optional) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-2 -ml-1 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
