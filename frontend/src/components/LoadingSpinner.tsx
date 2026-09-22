export default function LoadingSpinner({ className = "py-32" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="ui-spinner" />
    </div>
  );
}
