
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Pencil, BookOpen } from "lucide-react";

// Simulate data - in production, fetch from DB or compute based on recent activity
type DashboardStatsProps = {
  storiesCount: number;
  lastStoryAt?: string | null; // ISO date of last story posted
  storiesReadThisMonth: number; // from backend or mock
};

function getWritingFrequencyBadge(lastStoryAt: string | null | undefined) {
  if (!lastStoryAt) {
    return <Badge variant="outline" className="text-gray-500 bg-gray-50">New Writer</Badge>;
  }
  const last = new Date(lastStoryAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return <Badge className="bg-green-100 text-green-700"><Pencil className="w-4 h-4 mr-1 inline" />Daily Writer</Badge>;
  if (diffDays <= 7) return <Badge className="bg-amber-100 text-amber-700"><Pencil className="w-4 h-4 mr-1 inline" />Weekly Writer</Badge>;
  if (diffDays <= 30) return <Badge className="bg-yellow-50 text-yellow-800"><Pencil className="w-4 h-4 mr-1 inline" />Occasional Writer</Badge>;
  return <Badge variant="outline">Inactive</Badge>;
}

function getReadingBadge(storiesRead: number) {
  if (storiesRead > 15) return <Badge className="bg-blue-100 text-blue-700"><BookOpen className="w-4 h-4 mr-1 inline" />{storiesRead} stories read this month</Badge>;
  if (storiesRead > 0) return <Badge className="bg-blue-50 text-blue-600"><BookOpen className="w-4 h-4 mr-1 inline" />{storiesRead} stories read this month</Badge>;
  return <Badge variant="outline">No reading activity</Badge>;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ storiesCount, lastStoryAt, storiesReadThisMonth }) => (
  <div className="flex flex-wrap gap-3 py-2 animate-fade-in-up">
    {getWritingFrequencyBadge(lastStoryAt)}
    {getReadingBadge(storiesReadThisMonth)}
    <Badge variant="secondary" className="ml-2">Total stories: {storiesCount}</Badge>
  </div>
);

export default DashboardStats;
