import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Provider } from "react-redux";
import { store } from "./store";
import Header from "./components/Header";
import Designs from "./pages/Designs";
import DesignEditor from "./pages/DesignEditor";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <SignedIn>
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/designs" replace />} />
            <Route path="/designs" element={<Designs />} />
            <Route path="/design/:id" element={<DesignEditor />} />
          </Routes>
        </SignedIn>

        <SignedOut>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Canva Lite
              </h1>
              <p className="text-gray-600 mb-8">
                Sign in to access your designs
              </p>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Sign In to Continue
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <Toaster />
      </div>
    </Provider>
  );
}

export default App;
