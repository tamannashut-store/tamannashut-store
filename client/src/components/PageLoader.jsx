import logo from "../assets/logo.png";

function PageLoader({
  title = "Preparing your page",
  message = "This should only take a moment.",
}) {
  return (
    <div
      className="grid min-h-[65vh] place-items-center bg-brand-background px-6 py-16"
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <img
          src={logo}
          alt=""
          width="260"
          height="90"
          className="h-auto w-44 opacity-90 sm:w-48"
        />

        <div className="relative mt-8 h-11 w-11" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border-2 border-brand-primary/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-primary border-r-brand-primary/60 motion-reduce:animate-none" />
          <span className="absolute inset-[15px] rounded-full bg-brand-primary" />
        </div>

        <p className="mt-5 text-sm font-semibold tracking-wide text-brand-dark">
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
