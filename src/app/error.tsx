'use client';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-lg w-full text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-4">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-gray-600 mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
