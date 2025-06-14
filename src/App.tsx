import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import About from "./pages/About";
import Bookshelf from "./pages/Bookshelf";
import BookLibrary from "./pages/BookLibrary";
import ReadingGroups from "./pages/ReadingGroups";
import Reviews from "./pages/Reviews";
import AuthorConnect from "./pages/AuthorConnect";
import ReaderMap from "./pages/ReaderMap";
import Investors from "./pages/Investors";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/bookshelf" element={<Bookshelf />} />
            <Route path="/library" element={<BookLibrary />} />
            <Route path="/groups" element={<ReadingGroups />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/authors" element={<AuthorConnect />} />
            <Route path="/map" element={<ReaderMap />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
