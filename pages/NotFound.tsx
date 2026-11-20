import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-12">
    <div className="text-center">
      <h1 className="mb-3 font-heading text-4xl font-bold text-foreground">404</h1>
      <p className="mb-6 text-lg text-muted-foreground">This page does not exist.</p>
      <Button asChild><Link to="/">Return to Home</Link></Button>
    </div>
  </main>
);

export default NotFound;
