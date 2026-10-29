import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import SEO from '@/components/SEO';
import {
  archiveLibraryBook,
  restoreArchivedBook,
  getAdminArchivedBooks,
  AdminArchivedBookRecord,
  ArchiveClassification,
} from '@/utils/catalog/bookArchiveVault';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';
import { generateLibraryDuplicateAudit } from '@/utils/catalog/duplicateAudit';
import { applyDuplicateResolution } from '@/utils/catalog/duplicateResolution';
import {
  LibraryDuplicateAudit,
  AuditGroupSummary,
  DuplicateResolutionAction,
  ResolutionResult,
} from '@/types/bookCatalog';
import {
  Archive,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  RotateCcw,
  ShieldCheck,
  Eye,
  History,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', DE: '🇩🇪', FR: '🇫🇷',
  AU: '🇦🇺', SG: '🇸🇬', NL: '🇳🇱', ES: '🇪🇸', IT: '🇮🇹', BR: '🇧🇷',
  JP: '🇯🇵', CN: '🇨🇳', RU: '🇷🇺', ID: '🇮🇩', KR: '🇰🇷', AE: '🇦🇪',
  SA: '🇸🇦', PK: '🇵🇰', BD: '🇧🇩', NP: '🇳🇵', LK: '🇱🇰', MX: '🇲🇽',
  ZA: '🇿🇦', NG: '🇳🇬', EG: '🇪🇬', SE: '🇸🇪', CH: '🇨🇭', NO: '🇳🇴',
};

const getCountryFlag = (code?: string | null): string => {
  if (!code) return '🌐';
  const upper = code.toUpperCase();
  if (COUNTRY_FLAGS[upper]) return COUNTRY_FLAGS[upper];
  if (upper.length === 2) {
    const codePoints = upper
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }
  return '🌐';
};

const getDeviceIcon = (deviceType?: string | null) => {
  const dt = (deviceType || '').toLowerCase();
  if (dt === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-indigo-500" />;
  if (dt === 'tablet') return <Tablet className="w-3.5 h-3.5 text-amber-500" />;
  return <Monitor className="w-3.5 h-3.5 text-sky-500" />;
};

interface AdminLibraryArchiveProps {
  defaultTab?: 'active' | 'archived' | 'duplicate' | 'history' | 'visitors';
}

export const AdminLibraryArchive: React.FC<AdminLibraryArchiveProps> = ({ defaultTab = 'archived' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'duplicate' | 'history' | 'visitors'>(defaultTab);

  // Search & Filter state for Archived tab
  const [archivedSearch, setArchivedSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [archivedPage, setArchivedPage] = useState(1);
  const pageSize = 20;

  // Visitor Intelligence state
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorLimit, setVisitorLimit] = useState<number>(100);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Search & Filter state for Active tab
  const [activeSearch, setActiveSearch] = useState('');

  // Archival Modal state
  const [selectedBookToArchive, setSelectedBookToArchive] = useState<any | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveClassification, setArchiveClassification] = useState<ArchiveClassification>('unwanted');
  const [canonicalBookId, setCanonicalBookId] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSubmittingArchive, setIsSubmittingArchive] = useState(false);

  // Snapshot Inspection Modal state
  const [inspectSnapshot, setInspectSnapshot] = useState<any | null>(null);

  // Duplicate Resolution Preview Modal state
  const [selectedDupGroup, setSelectedDupGroup] = useState<AuditGroupSummary | null>(null);
  const [selectedDupAction, setSelectedDupAction] = useState<DuplicateResolutionAction | null>(null);
  const [previewResult, setPreviewResult] = useState<ResolutionResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExecutingResolution, setIsExecutingResolution] = useState(false);

  // 1. Fetch Archived Books
  const {
    data: archivedBooks = [],
    isLoading: isArchivedLoading,
    refetch: refetchArchived,
  } = useQuery<AdminArchivedBookRecord[]>({
    queryKey: ['admin-archived-books', archivedSearch, classificationFilter, archivedPage],
    queryFn: () =>
      getAdminArchivedBooks({
        search: archivedSearch,
        classification: classificationFilter,
        limit: pageSize,
        offset: (archivedPage - 1) * pageSize,
      }),
  });

  // 2. Fetch Active Books (for Active tab inspection)
  const {
    data: activeBooks = [],
    isLoading: isActiveLoading,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['admin-active-catalog-sample', activeSearch],
    enabled: activeTab === 'active',
    queryFn: async () => {
      const caps = await detectBookSchemaCapabilities();
      let query = supabase
        .from('books_library')
        .select('*');

      query = applyPublicBookFilter(query, caps);

      if (activeSearch.trim()) {
        query = query.or(`title.ilike.%${activeSearch.trim()}%,author.ilike.%${activeSearch.trim()}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        console.warn('Error fetching active books:', error);
        return [];
      }
      return filterPublicBooks(data || []);
    },
  });

  // 3. Fetch Duplicate Review Data
  const {
    data: auditData,
    isLoading: isAuditLoading,
    isFetching: isAuditFetching,
    refetch: refetchAudit,
  } = useQuery<LibraryDuplicateAudit>({
    queryKey: ['library-duplicate-audit'],
    enabled: activeTab === 'duplicate',
    queryFn: () => generateLibraryDuplicateAudit(),
    staleTime: 5 * 60 * 1000,
  });

  // 4. Fetch Archive & Resolution History Logs
  const {
    data: historyLogs = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['admin-archive-history-logs'],
    enabled: activeTab === 'history',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_duplicate_audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Could not fetch audit history logs:', error);
        return [];
      }
      return data || [];
    },
  });

  // 5. Fetch Visitor Logs (for Visitor Intelligence tab)
  const {
    data: recentVisits = [],
    isLoading: isVisitsLoading,
    refetch: refetchVisits,
    isFetching: isVisitsFetching,
  } = useQuery({
    queryKey: ['admin-visitor-intelligence', visitorSearch, visitorLimit],
    enabled: activeTab === 'visitors',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_recent_visits', {
        p_limit: visitorLimit,
        p_search: visitorSearch.trim() || null,
      });

      if (error) {
        console.warn('get_admin_recent_visits RPC failed:', error.message);
        return [];
      }

      return data || [];
    },
    refetchInterval: activeTab === 'visitors' ? 15000 : false,
  });

  const handleCopyIp = (ip: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      toast({ title: 'IP Copied', description: `${ip} copied to clipboard.` });
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Handle Archive Action Submit
  const handleArchiveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookToArchive) return;
    if (!archiveReason.trim()) {
      toast({ title: 'Reason Required', description: 'Please provide a valid archive reason.', variant: 'destructive' });
      return;
    }

    setIsSubmittingArchive(true);
    try {
      const res = await archiveLibraryBook(selectedBookToArchive.id, archiveReason.trim(), {
        classification: archiveClassification,
        canonicalBookId: canonicalBookId.trim() || undefined,
      });

      toast({
        title: 'Book Safely Archived',
        description: res.message,
      });

      setIsArchiveModalOpen(false);
      setSelectedBookToArchive(null);
      setArchiveReason('');
      setCanonicalBookId('');
      void refetchArchived();
      void refetchActive();
      void refetchAudit();
    } catch (err: any) {
      toast({
        title: 'Archive Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingArchive(false);
    }
  };

  // Handle Restore Action
  const handleRestore = async (bookId: string, restoreReason: string = 'Restored by administrator') => {
    try {
      const res = await restoreArchivedBook(bookId, restoreReason, 'active');
      toast({
        title: 'Book Restored to Public Library',
        description: res.message,
      });
      void refetchArchived();
      void refetchActive();
      void refetchHistory();
    } catch (err: any) {
      toast({
        title: 'Restore Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Duplicate Resolution Preview & Execution
  const handleDuplicatePreview = async (group: AuditGroupSummary, action: DuplicateResolutionAction) => {
    setSelectedDupGroup(group);
    setSelectedDupAction(action);
    try {
      const res = await applyDuplicateResolution(group.groupId, action, { dryRun: true });
      setPreviewResult(res);
      setIsPreviewOpen(true);
    } catch (err: any) {
      toast({ title: 'Preview Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleExecuteDuplicateResolution = async () => {
    if (!selectedDupGroup || !selectedDupAction) return;
    setIsExecutingResolution(true);
    try {
      const res = await applyDuplicateResolution(selectedDupGroup.groupId, selectedDupAction, { dryRun: false });
      toast({ title: 'Resolution Applied', description: res.message });
      setIsPreviewOpen(false);
      void refetchAudit();
      void refetchArchived();
      void refetchHistory();
    } catch (err: any) {
      toast({ title: 'Execution Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsExecutingResolution(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Library Archive & Recovery Vault"
        description="Admin dashboard to safely archive unwanted or duplicate books, hide them from public discovery, and restore them with 1-click."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Archive className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Library Archive & Recovery Vault</h1>
            </div>
            <p className="text-sm text-slate-500">
              Non-destructive catalog management: unwanted, duplicate, or incomplete records are hidden safely without breaking user shelves or deleting data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'archived'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-amber-600" />
                Archived Books
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Active Catalog
              </button>
              <button
                onClick={() => setActiveTab('duplicate')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'duplicate'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                Duplicate Review
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                Archive History
              </button>
              <button
                onClick={() => setActiveTab('visitors')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'visitors'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                Visitor Intelligence
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: ARCHIVED BOOKS */}
        {activeTab === 'archived' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search title, author, or reason..."
                    value={archivedSearch}
                    onChange={(e) => {
                      setArchivedSearch(e.target.value);
                      setArchivedPage(1);
                    }}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={classificationFilter}
                    onChange={(e) => {
                      setClassificationFilter(e.target.value);
                      setArchivedPage(1);
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="all">All Classifications</option>
                    <option value="unwanted">Unwanted</option>
                    <option value="duplicate">Duplicate Edition</option>
                    <option value="junk">Junk / Spam</option>
                    <option value="low_quality">Low Quality</option>
                    <option value="superseded">Superseded</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { void refetchArchived(); }} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Archived Books Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {isArchivedLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : archivedBooks.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <Archive className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No archived books found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All matching catalog records are active. When you archive books from the Active Catalog or Duplicate Review, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Book Info</th>
                        <th className="p-3">Classification & Reason</th>
                        <th className="p-3">Archived Info</th>
                        <th className="p-3">User References</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {archivedBooks.map((b) => (
                        <tr key={b.archive_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {b.cover_image_url ? (
                                <img
                                  src={b.cover_image_url}
                                  alt={b.title}
                                  className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-slate-100 rounded flex items-center justify-center text-slate-400 shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 line-clamp-1">{b.title}</div>
                                <div className="text-[11px] text-slate-500">{b.author || 'Unknown Author'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {b.book_id.slice(0, 8)}... | {b.isbn ? `ISBN: ${b.isbn}` : 'No ISBN'}
                                </div>
                                {b.canonical_title && (
                                  <div className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded inline-block">
                                    Canonical: {b.canonical_title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 max-w-xs">
                            <div className="space-y-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold uppercase ${
                                  b.archive_classification === 'duplicate'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : b.archive_classification === 'junk'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : b.archive_classification === 'low_quality'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {b.archive_classification}
                              </Badge>
                              <div className="text-[11px] text-slate-600 italic">
                                "{b.archive_reason || 'No reason specified'}"
                              </div>
                            </div>
                          </td>

                          <td className="p-3 whitespace-nowrap text-slate-500 text-[11px]">
                            <div>{new Date(b.archived_at).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">
                              By: {b.archived_by_email || b.archived_by?.slice(0, 8) || 'Admin'}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                📚 {b.user_shelves_count} shelves
                              </span>
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                ⏱️ {b.reading_progress_count} progress
                              </span>
                              {b.margin_notes_count > 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-medium">
                                  📝 {b.margin_notes_count} notes
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.book_snapshot && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-slate-500 hover:text-slate-800"
                                  onClick={() => setInspectSnapshot(b.book_snapshot)}
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Snapshot
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                                onClick={() => handleRestore(b.book_id)}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Page {archivedPage}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    disabled={archivedPage <= 1}
                    onClick={() => setArchivedPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    disabled={archivedBooks.length < pageSize}
                    onClick={() => setArchivedPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CATALOG */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search active books to review..."
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => { void refetchActive(); }} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {isActiveLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Book</th>
                        <th className="p-3">Quality & Integrity</th>
                        <th className="p-3">Format / Access</th>
                        <th className="p-3">Added Date</th>
                        <th className="p-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeBooks.map((book: any) => {
                        const hasCover = Boolean(book.cover_image_url);
                        const hasPdf = Boolean(book.pdf_url);
                        const hasIsbn = Boolean(book.isbn);

                        return (
                          <tr key={book.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {hasCover ? (
                                  <img
                                    src={book.cover_image_url}
                                    alt={book.title}
                                    className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-14 bg-slate-100 rounded flex items-center justify-center text-slate-400 shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-900 line-clamp-1">{book.title}</div>
                                  <div className="text-[11px] text-slate-500">{book.author || 'Unknown Author'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">ID: {book.id.slice(0, 8)}...</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                {!hasCover && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-medium">
                                    Missing Cover
                                  </span>
                                )}
                                {!hasPdf && (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 rounded font-medium">
                                    Missing Ebook File
                                  </span>
                                )}
                                {!hasIsbn && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    No ISBN
                                  </span>
                                )}
                                {hasCover && hasPdf && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                                    Complete Record
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-[11px]">
                              {book.pdf_url ? (
                                <a
                                  href={book.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[10px]"
                                >
                                  Open File <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>

                            <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                              {book.created_at ? new Date(book.created_at).toLocaleDateString() : '—'}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold gap-1"
                                onClick={() => {
                                  setSelectedBookToArchive(book);
                                  setIsArchiveModalOpen(true);
                                }}
                              >
                                <Archive className="w-3 h-3 text-amber-600" />
                                Archive from Library
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DUPLICATE REVIEW */}
        {activeTab === 'duplicate' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Signal Duplicate Clustering</h3>
                <p className="text-xs text-slate-500">
                  Best quality edition recommended first. Ambiguous translations and distinct authors are preserved.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { void refetchAudit(); }} disabled={isAuditFetching} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditFetching ? 'animate-spin' : ''}`} />
                Run Duplicate Scan
              </Button>
            </div>

            {isAuditLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : !auditData || auditData.groups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                No duplicate candidate groups detected in the catalog.
              </div>
            ) : (
              <div className="space-y-4">
                {auditData.groups.map((group) => (
                  <div key={group.groupId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{group.clusterTitle}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {group.classification.replace(/_/g, ' ')}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-semibold ${
                              group.confidence === 'high'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {group.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Author: {group.author} | {group.candidateRecords.length} records in cluster</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => handleDuplicatePreview(group, 'keep_separate')}
                        >
                          Keep Separate
                        </Button>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold gap-1.5"
                          onClick={() => handleDuplicatePreview(group, 'merge_and_archive_duplicates')}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Resolve & Archive Duplicates
                        </Button>
                      </div>
                    </div>

                    {/* Candidate Records in Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.candidateRecords.map((cand, idx) => (
                        <div
                          key={cand.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                            cand.isRecommendedPrimary
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {cand.cover_image_url ? (
                            <img src={cand.cover_image_url} alt={cand.title} className="w-10 h-14 object-cover rounded shrink-0 shadow-xs" />
                          ) : (
                            <div className="w-10 h-14 bg-slate-200 rounded flex items-center justify-center text-slate-400 shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 truncate">{cand.title}</span>
                              <Badge className="text-[10px] font-bold">
                                {cand.qualityScore}/100
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{cand.author}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {cand.id.slice(0, 8)}...</div>
                            {cand.isRecommendedPrimary && (
                              <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Recommended Primary Edition
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ARCHIVE HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Archive & Resolution Audit Trail</h3>
                <p className="text-xs text-slate-500">Every archive, restore, and merge operation is permanently logged.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { void refetchHistory(); }} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            {isHistoryLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No archive or restore actions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target ID</th>
                      <th className="p-3">Affected Books</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3 text-right">Undo / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {historyLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {log.action}
                        </td>
                        <td className="p-3 font-mono text-[10px]">
                          {log.primary_book_id ? log.primary_book_id.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="p-3">
                          {Array.isArray(log.affected_book_ids) ? log.affected_book_ids.length : 0} records
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {log.reason || '—'}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {Array.isArray(log.affected_book_ids) && log.affected_book_ids.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-indigo-600 hover:text-indigo-700 gap-1"
                              onClick={() => handleRestore(log.affected_book_ids[0], `Undo from history log ${log.id}`)}
                            >
                              <RotateCcw className="w-3 h-3" /> Restore Record
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VISITOR INTELLIGENCE & IP LOGS */}
        {activeTab === 'visitors' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by IP, city, country, or route..."
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={visitorLimit}
                    onChange={(e) => setVisitorLimit(Number(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value={50}>Last 50 Visits</option>
                    <option value={100}>Last 100 Visits</option>
                    <option value={250}>Last 250 Visits</option>
                    <option value={500}>Last 500 Visits</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-sync: 15s
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { void refetchVisits(); }}
                  disabled={isVisitsFetching}
                  className="gap-1.5 text-xs h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVisitsFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Visits in View</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{recentVisits.length.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Most recent traffic events</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Unique IPs</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">
                  {new Set(recentVisits.map((v: any) => v.ip_address).filter(Boolean)).size.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Distinct visitor addresses</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Countries Active</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {new Set(recentVisits.map((v: any) => v.country_code).filter(Boolean)).size.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Global locations represented</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mobile vs Desktop</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {recentVisits.filter((v: any) => (v.device_type || '').toLowerCase() === 'mobile').length} / {recentVisits.filter((v: any) => (v.device_type || '').toLowerCase() !== 'mobile').length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Mobile / Desktop sessions</div>
              </div>
            </div>

            {/* Visits Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Visitor Access Log</h3>
                  <p className="text-xs text-slate-500">Real-time unmasked client IP addresses, geo-location, user-agents, and visited paths.</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Showing {recentVisits.length} entries
                </div>
              </div>

              {isVisitsLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentVisits.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No visitor records found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {visitorSearch
                      ? `No visits matched your search term "${visitorSearch}". Try clearing the filter.`
                      : 'No website visit logs recorded yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Visited At</th>
                        <th className="p-3">Client IP Address</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Route / URL</th>
                        <th className="p-3">Device & Browser</th>
                        <th className="p-3">Tech Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                      {recentVisits.map((v: any) => {
                        const isCopied = copiedIp === v.ip_address;
                        const dateObj = new Date(v.visited_at);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                        const countryFlag = getCountryFlag(v.country_code);

                        return (
                          <tr key={v.id || `${v.visited_at}-${v.ip_address}`} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">{timeStr}</div>
                              <div className="text-[10px] text-slate-400">{dateStr}</div>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded text-slate-900 font-medium select-all">
                                  {v.ip_address || 'Unknown'}
                                </span>
                                {v.ip_address && v.ip_address !== 'Unknown' && (
                                  <button
                                    onClick={() => handleCopyIp(v.ip_address)}
                                    title="Copy IP address"
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base leading-none" title={v.country_code || 'Global'}>
                                  {countryFlag}
                                </span>
                                <div>
                                  <div className="font-semibold text-slate-900 line-clamp-1">{v.city || 'Unknown City'}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {[v.region, v.country_code].filter(Boolean).join(' • ') || 'No Geo Data'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 max-w-[200px]">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-sky-800 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded truncate inline-block max-w-[180px]">
                                  {v.page_url || '/'}
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-slate-100 shrink-0">
                                  {getDeviceIcon(v.device_type)}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900 text-xs flex items-center gap-1">
                                    {v.browser || 'Unknown'} {v.browser_version ? <span className="text-slate-400 text-[10px]">v{v.browser_version}</span> : null}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {v.os || 'Unknown OS'} • {v.device_type || 'Desktop'}
                                    {v.device_model ? ` (${v.device_model})` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 text-[11px] text-slate-500 max-w-[180px]">
                              <div>{v.screen_resolution || '—'}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {v.language ? `Lang: ${v.language}` : ''}
                                {v.referrer ? ` | Ref: ${v.referrer}` : ''}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Archive Book Modal Dialog */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleArchiveConfirm}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                Archive Book from Public Library
              </DialogTitle>
              <DialogDescription>
                Hides the book from user searches and library discovery while safely preserving its recovery snapshot.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {selectedBookToArchive && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-900">{selectedBookToArchive.title}</div>
                  <div className="text-slate-500">{selectedBookToArchive.author || 'Unknown Author'}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {selectedBookToArchive.id}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Archive Reason (Required)</label>
                <Input
                  required
                  placeholder="e.g. Duplicate edition / Low scan quality / Unwanted entry"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Classification</label>
                <select
                  value={archiveClassification}
                  onChange={(e) => setArchiveClassification(e.target.value as ArchiveClassification)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700"
                >
                  <option value="unwanted">Unwanted Book</option>
                  <option value="duplicate">Duplicate Edition</option>
                  <option value="junk">Junk / Spam Record</option>
                  <option value="low_quality">Low Scan / Format Quality</option>
                  <option value="superseded">Superseded by Better Edition</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Canonical Book UUID (Optional)</label>
                <Input
                  placeholder="If duplicate, enter UUID of primary canonical book"
                  value={canonicalBookId}
                  onChange={(e) => setCanonicalBookId(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Non-Destructive Protection Guarantee
                </div>
                <p>
                  The book will <strong>NOT be deleted</strong> from the database. Existing user shelves, progress, and notes referencing this UUID remain safe. You can restore it anytime in 1 click.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsArchiveModalOpen(false)}
                disabled={isSubmittingArchive}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={isSubmittingArchive || !archiveReason.trim()}
              >
                {isSubmittingArchive ? 'Archiving...' : 'Confirm & Archive Book'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Snapshot Inspection Modal */}
      <Dialog open={!!inspectSnapshot} onOpenChange={() => setInspectSnapshot(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Recovery Snapshot Data
            </DialogTitle>
            <DialogDescription>
              Complete metadata snapshot captured at the moment of archival.
            </DialogDescription>
          </DialogHeader>

          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto font-mono">
            {JSON.stringify(inspectSnapshot, null, 2)}
          </pre>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectSnapshot(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Resolution Impact Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Preview Changes Before Approval
            </DialogTitle>
            <DialogDescription>
              Inspect the exact metadata merge and non-destructive archival plan.
            </DialogDescription>
          </DialogHeader>

          {previewResult && selectedDupGroup && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900">Action: {selectedDupAction}</div>
                <div className="text-slate-600">
                  Target Group: <span className="font-bold text-slate-800">{selectedDupGroup.clusterTitle}</span>
                </div>
                <div className="text-slate-600">
                  Primary Retained ID: <span className="font-mono text-[11px]">{previewResult.primaryId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800">Impact Analysis:</div>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      <strong className="text-slate-900">{previewResult.archivedBookIds.length} redundant editions</strong> will be archived into the vault (hidden from search, safely preserved).
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      <strong className="text-slate-900">{previewResult.mergedFields.length} metadata fields</strong> will be backfilled into the primary record: {previewResult.mergedFields.join(', ') || 'None'}.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      User shelves and progress will be transactionally preserved without duplicates.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={isExecutingResolution}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={handleExecuteDuplicateResolution}
              disabled={isExecutingResolution}
            >
              {isExecutingResolution ? 'Applying...' : 'Approve & Execute Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLibraryArchive;

