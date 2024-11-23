import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        setLocation('/auth');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col"
         style={{
           backgroundImage: `url(https://images.unsplash.com/photo-1508948414348-13a52d2ec394)`,
           backgroundSize: 'cover',
           backgroundAttachment: 'fixed',
           backgroundBlendMode: 'overlay',
           backgroundColor: 'rgba(255, 255, 255, 0.95)'
         }}>
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scholar's Archive</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-center text-sm text-muted-foreground">
          Scholar's Archive © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
