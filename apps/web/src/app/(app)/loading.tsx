export default function AppLoading() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            {/* Page title skeleton */}
            <div className="h-8 w-48 bg-white/5 rounded-lg" />

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />
                ))}
            </div>

            {/* Content grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5" />
                ))}
            </div>
        </div>
    );
}
