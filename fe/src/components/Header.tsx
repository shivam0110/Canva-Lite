import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

function Header() {
  const { isLoaded } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-2.5">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/">
          <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
            Canva Lite
          </h1>
        </Link>
        <div>
          {!isLoaded ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
