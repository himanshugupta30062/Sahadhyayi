import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuddyReadsLink() {
  return <Button variant="outline" asChild><Link to="/buddy-reads"><BookOpen className="mr-2 h-4 w-4"/>Buddy Reads</Link></Button>;
}
