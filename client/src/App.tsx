import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StripeProvider } from "@/contexts/StripeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CreatorStorefront from "@/pages/CreatorStorefront";
import VideoDetail from "@/pages/VideoDetail";
import ViewerHome from "@/pages/ViewerHome";
import MyLibrary from "@/pages/MyLibrary";
import ExplorePage from "@/pages/ExplorePage";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import EditVideoComingSoon from "@/pages/EditVideoComingSoon";
import EditProfile from "@/pages/EditProfile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ViewerHome} />
      <Route path="/home" component={Home} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/edit-video-coming-soon" component={EditVideoComingSoon} />
      <Route path="/creator/:username" component={CreatorStorefront} />
      <Route path="/video/:id" component={VideoDetail} />
      <Route path="/library" component={MyLibrary} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancel" component={PaymentCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StripeProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </StripeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
