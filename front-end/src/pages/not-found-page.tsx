import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="max-w-3xl mx-auto pt-10">
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">Page not found</h1>
      <p className="text-on-surface-variant font-body mb-8">
        The page you are looking for does not exist. Use the command center navigation to continue.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary-container text-on-primary-container font-headline font-bold hover:opacity-90 transition-opacity"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};
