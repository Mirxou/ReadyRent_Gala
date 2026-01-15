export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
            <div className="relative">
                <div className="h-24 w-24 rounded-full border-t-4 border-gala-purple animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-b-4 border-gala-pink animate-spin-reverse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gala-gold animate-pulse font-bold">GALA</span>
                </div>
            </div>
        </div>
    );
}
