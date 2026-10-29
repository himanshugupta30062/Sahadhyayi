import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import SEO from '@/components/SEO';
import {
  LibraryDuplicateAudit,
  AuditGroupSummary,
  DuplicateResolutionAction,
  ResolutionResult,
} from '@/types/bookCatalog';
import { generateLibraryDuplicateAudit } from '@/utils/catalog/duplicateAudit';
import { applyDuplicateResolution, verifyAdminStatus } from '@/utils/catalog/duplicateResolution';
import {
  archiveUnwantedBook,
  restoreBookFromArchive,
  getArchivedBooks,
  runSafeCleanupUnusedBooks,
  ArchivedBookRecord,
} from '@/utils/catalog/bookArchiveVault';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  BookOpen,
  Archive,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  History,
  RotateCcw,
  Database,
  Plus,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdminLibraryQuality: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'audit' | 'history' | 'vault'>('audit');
  const [filter, setFilter] = useState<'all' | 'high_confidence' | 'needs_review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [unwantedBookId, setUnwantedBookId] = useState('');
  const [archiveReasonInput, setArchiveReasonInput] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Preview / Confirmation modal state
  const [selectedGroup, setSelectedGroup] = useState<AuditGroupSummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<DuplicateResolutionAction | null>(null);
  const [previewResult, setPreviewResult] = useState<ResolutionResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // 1. Verify Admin Status
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    queryFn: verifyAdminStatus,
  });

  // 2. Fetch or Run Audit
  const {
    data: auditData,
    isLoading: auditLoading,
    isFetching: auditFetching,
    refetch: runAudit,
  } = useQuery<LibraryDuplicateAudit>({
    queryKey: ['library-duplicate-audit'],
    enabled: !!user && isAdmin === true,
    queryFn: () => generateLibraryDuplicateAudit(),
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch Audit Logs for History/Undo Tab
  const { data: auditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['duplicate-audit-logs'],
    enabled: !!user && isAdmin === true && activeTab === 'history',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_duplicate_audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.warn('Could not fetch audit logs:', error);
        return [];
      }
      return data || [];
    },
  });

  // Action mutation
  const resolveMutation = useMutation({
    mutationFn: async ({
      groupId,
      action,
      dryRun,
    }: {
      groupId: string;
      action: DuplicateResolutionAction;
      dryRun?: boolean;
    }) => {
      return applyDuplicateResolution(groupId, action, { dryRun });
    },
    onSuccess: (data, vars) => {
      if (vars.dryRun) {
        setPreviewResult(data);
        setIsPreviewOpen(true);
      } else {
        toast({
          title: 'Resolution Applied',
          description: data.message,
        });
        setIsPreviewOpen(false);
        void queryClient.invalidateQueries({ queryKey: ['library-duplicate-audit'] });
        void queryClient.invalidateQueries({ queryKey: ['duplicate-audit-logs'] });
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Operation Failed',
        description: err.message || 'Error applying duplicate resolution',
        variant: 'destructive',
      });
    },
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handlePreview = async (group: AuditGroupSummary, action: DuplicateResolutionAction) => {
    setSelectedGroup(group);
    setSelectedAction(action);
    resolveMutation.mutate({ groupId: group.groupId, action, dryRun: true });
  };

  const handleConfirmExecute = async () => {
    if (!selectedGroup || !selectedAction) return;
    setIsExecuting(true);
    try {
      await resolveMutation.mutateAsync({
        groupId: selectedGroup.groupId,
        action: selectedAction,
        dryRun: false,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRestore = async (bookId: string) => {
    try {
      const result = await applyDuplicateResolution(`restore-${bookId}`, 'restore_archived_record', {
        customPrimaryId: bookId,
      });
      toast({
        title: 'Record Restored',
        description: result.message,
      });
      void refetchLogs();
      void refetchVault();
      runAudit();
    } catch (err: any) {
      toast({
        title: 'Restore Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // 4. Fetch Archived Books from Vault
  const {
    data: archivedBooks = [],
    isLoading: vaultLoading,
    refetch: refetchVault,
  } = useQuery<ArchivedBookRecord[]>({
    queryKey: ['archived-books-vault'],
    enabled: !!user && isAdmin === true,
    queryFn: getArchivedBooks,
  });

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unwantedBookId.trim()) return;
    setIsArchiving(true);
    try {
      const res = await archiveUnwantedBook(
        unwantedBookId.trim(),
        archiveReasonInput.trim() || 'Archived by administrator'
      );
      toast({
        title: 'Book Safely Archived',
        description: res.message,
      });
      setUnwantedBookId('');
      setArchiveReasonInput('');
      setIsArchiveModalOpen(false);
      void refetchVault();
      runAudit();
    } catch (err: any) {
      toast({
        title: 'Archival Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestoreFromVault = async (bookId: string) => {
    try {
      const res = await restoreBookFromArchive(bookId);
      toast({
        title: 'Book Restored to Active Library',
        description: res.message,
      });
      void refetchVault();
      runAudit();
    } catch (err: any) {
      toast({
        title: 'Restore Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleRunSafeCleanup = async () => {
    if (!window.confirm('Run automated non-destructive cleanup? This will detect unused duplicate books and move them to the hidden vault without deleting any book.')) {
      return;
    }
    setIsCleaning(true);
    try {
      const count = await runSafeCleanupUnusedBooks();
      toast({
        title: 'Safe Cleanup Completed',
        description: `Moved ${count} redundant entries to the archive vault without deleting any records.`,
      });
      void refetchVault();
      runAudit();
    } catch (err: any) {
      toast({
        title: 'Cleanup Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user || isAdmin !== true) {
    return <Navigate to="/" replace />;
  }

  // Filter groups
  const groups = (auditData?.groups || []).filter((g) => {
    if (filter === 'high_confidence' && g.confidence !== 'high') return false;
    if (filter === 'needs_review' && !g.requiresManualReview) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.clusterTitle.toLowerCase().includes(q) ||
        g.author.toLowerCase().includes(q) ||
        g.candidateRecords.some((c) => c.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Catalog Quality & Duplicate Review"
        description="Admin dashboard to identify duplicate editions, review recommendations, and safely merge or archive records."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Library Quality & Duplicate Review</h1>
            </div>
            <p className="text-sm text-slate-500">
              Automated duplicate edition clustering, 100-point transparent quality ranking, and non-destructive resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'audit' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Review Queue
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  activeTab === 'history' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'vault' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                Archive Vault
                {archivedBooks.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {archivedBooks.length}
                  </span>
                )}
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => runAudit()}
              disabled={auditFetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${auditFetching ? 'animate-spin' : ''}`} />
              Run Audit
            </Button>
          </div>
        </div>

        {activeTab === 'audit' && (
          <>
            {/* Dynamic Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Scanned Books</div>
                <div className="text-2xl font-bold text-slate-900">
                  {auditLoading ? '...' : (auditData?.totalRecordsScanned ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Total active catalog rows</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Duplicate Groups</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {auditLoading ? '...' : (auditData?.candidateGroupsCount ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Clusters sharing identity</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Redundant Editions</div>
                <div className="text-2xl font-bold text-amber-600">
                  {auditLoading ? '...' : (auditData?.summary.potentialRedundantRecords ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Candidates for archive</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">High Confidence</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {auditLoading ? '...' : (auditData?.highConfidenceGroupsCount ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Ready for 1-click merge</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Protected User Refs</div>
                <div className="text-2xl font-bold text-sky-600">
                  {auditLoading ? '...' : (auditData?.summary.executionImpact.userReferencesToSafelyMigrate ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Shelves & progress preserved</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Filter:</span>
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className="h-8 text-xs"
                >
                  All Groups ({auditData?.groups?.length ?? 0})
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'high_confidence' ? 'default' : 'outline'}
                  onClick={() => setFilter('high_confidence')}
                  className="h-8 text-xs"
                >
                  High Confidence ({auditData?.highConfidenceGroupsCount ?? 0})
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'needs_review' ? 'default' : 'outline'}
                  onClick={() => setFilter('needs_review')}
                  className="h-8 text-xs"
                >
                  Needs Review ({auditData?.ambiguousGroupsCount ?? 0})
                </Button>
              </div>
            </div>

            {/* Groups Queue */}
            {auditLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Duplicates Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  The catalog currently has no unresolved candidate duplicate groups matching your filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => {
                  const isExpanded = Boolean(expandedGroups[group.groupId]);
                  return (
                    <div
                      key={group.groupId}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Group Header Card */}
                      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-slate-900">
                              {group.clusterTitle}
                            </h2>
                            <Badge variant="outline" className="text-[11px] bg-white">
                              {group.count} records
                            </Badge>
                            <Badge
                              className={`text-[11px] font-medium ${
                                group.confidence === 'high'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : group.confidence === 'medium'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {group.confidence.toUpperCase()} CONFIDENCE
                            </Badge>
                            {group.requiresManualReview && (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="w-3 h-3" /> Manual Review
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            By <span className="font-semibold text-slate-700">{group.author}</span> • Classification:{' '}
                            <span className="font-medium text-slate-700">{group.classification.replace(/_/g, ' ')}</span>
                          </p>
                        </div>

                        {/* Top Group Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-8 text-xs font-semibold"
                            onClick={() => handlePreview(group, 'merge_and_archive_duplicates')}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Keep Best & Archive ({group.archiveCandidatesCount})
                          </Button>

                          {group.recommendedSecondary && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-medium"
                              onClick={() => handlePreview(group, 'keep_top_editions')}
                            >
                              <Layers className="w-3.5 h-3.5" />
                              Keep Top Editions
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-slate-500 hover:text-slate-800"
                            onClick={() => toggleGroup(group.groupId)}
                          >
                            {isExpanded ? (
                              <span className="flex items-center gap-1">Hide Candidates <ChevronUp className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="flex items-center gap-1">Inspect All ({group.count}) <ChevronDown className="w-3.5 h-3.5" /></span>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Top Recommended Editions Display */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-indigo-50/20 via-white to-slate-50/20">
                        {/* Primary Record Box */}
                        <div className="border border-emerald-200/80 bg-emerald-50/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RECOMMENDED PRIMARY
                            </span>
                            <span className="text-xs font-bold text-emerald-800">
                              Quality: {group.recommendedPrimary.qualityScore}/100
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 line-clamp-1">
                            {group.recommendedPrimary.title}
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-2">
                            {group.recommendedPrimary.reason}
                          </div>
                        </div>

                        {/* Secondary Record Box (if justified) */}
                        {group.recommendedSecondary ? (
                          <div className="border border-sky-200/80 bg-sky-50/30 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                                <BookOpen className="w-3 h-3 text-sky-600" /> PRESERVED ALTERNATIVE
                              </span>
                              <span className="text-xs font-bold text-sky-800">
                                Quality: {group.recommendedSecondary.qualityScore}/100
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-900 line-clamp-1">
                              {group.recommendedSecondary.title}
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-2">
                              {group.recommendedSecondary.reason}
                            </div>
                          </div>
                        ) : (
                          <div className="border border-slate-200/60 bg-slate-50/40 rounded-xl p-4 flex flex-col justify-center text-xs text-slate-500">
                            <span className="font-semibold text-slate-700 mb-1">Single Canonical Manifestation</span>
                            All candidate records represent the same edition. No secondary edition is needed.
                          </div>
                        )}
                      </div>

                      {/* Expanded Candidates Table */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 p-5 bg-white space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Candidate Records in this Cluster ({group.candidateRecords.length})
                          </h4>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="p-3">Role</th>
                                  <th className="p-3">Title & Contributor</th>
                                  <th className="p-3">Score</th>
                                  <th className="p-3">Identifiers & Year</th>
                                  <th className="p-3">User References</th>
                                  <th className="p-3">Proposed Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {group.candidateRecords.map((cand) => (
                                  <tr
                                    key={cand.id}
                                    className={`${
                                      cand.isPrimary
                                        ? 'bg-emerald-50/40'
                                        : cand.isSecondary
                                        ? 'bg-sky-50/40'
                                        : 'hover:bg-slate-50/60'
                                    }`}
                                  >
                                    <td className="p-3 whitespace-nowrap">
                                      {cand.isPrimary ? (
                                        <Badge className="bg-emerald-600 text-white text-[10px]">Primary</Badge>
                                      ) : cand.isSecondary ? (
                                        <Badge className="bg-sky-600 text-white text-[10px]">Alternative</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] text-slate-500">Duplicate</Badge>
                                      )}
                                    </td>
                                    <td className="p-3 font-medium">
                                      <div className="font-semibold text-slate-900">{cand.title}</div>
                                      <div className="text-[11px] text-slate-500">{cand.author}</div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap font-bold">
                                      {cand.qualityScore}/100
                                      <div className="text-[10px] font-normal text-slate-500">{cand.accessStatus}</div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-[11px]">
                                      <div>ISBN: {cand.isbn || 'None'}</div>
                                      <div>Year: {cand.publication_year || 'Unknown'}</div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-[11px]">
                                      {cand.userReferences.total > 0 ? (
                                        <span className="font-semibold text-amber-700">
                                          {cand.userReferences.total} refs (Shelves: {cand.userReferences.bookshelf}, Progress: {cand.userReferences.readingProgress})
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">0 refs</span>
                                      )}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          cand.isPrimary || cand.isSecondary
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {cand.proposedAction}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex items-center justify-between pt-2 text-xs">
                            <span className="text-slate-500">
                              {group.warnings.length > 0 && (
                                <span className="text-amber-700 font-medium">⚠️ {group.warnings[0]}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handlePreview(group, 'keep_separate')}
                              >
                                Mark as False Positive
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-rose-600 hover:text-rose-700"
                                onClick={() => handlePreview(group, 'archive_junk')}
                              >
                                Mark Junk
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Audit Logs / Undo History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Duplicate Resolution Audit Logs</h3>
                <p className="text-xs text-slate-500">Every cleanup action is recorded with full rollback snapshot.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { void refetchLogs(); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No duplicate resolution actions have been executed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Primary Book ID</th>
                      <th className="p-3">Affected Records</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Undo / Restore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="p-3 whitespace-nowrap text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {log.action}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {log.primary_book_id ? log.primary_book_id.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="p-3">
                          {Array.isArray(log.affected_book_ids) ? log.affected_book_ids.length : 0} books
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {log.reason || '—'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {Array.isArray(log.affected_book_ids) && log.affected_book_ids.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700"
                              onClick={() => handleRestore(log.affected_book_ids[0])}
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
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

        {/* Archive Vault (Hidden Books) Tab */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-300/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-amber-500/20 text-amber-800 rounded-xl mt-0.5">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Non-Destructive Book Vault (Hidden from Users)
                    <Badge variant="outline" className="bg-white/80 text-amber-800 border-amber-200 text-[11px]">
                      {archivedBooks.length} Records Preserved
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Books placed in this vault are completely hidden from user search results, public shelves, and discovery.
                    They are <strong>never permanently deleted</strong>. As an authorized administrator, you can inspect their original metadata and bring any book back to the active library anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
                  onClick={() => setIsArchiveModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Archive Book by ID
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-100/50 gap-1.5"
                  onClick={handleRunSafeCleanup}
                  disabled={isCleaning}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCleaning ? 'animate-spin' : ''}`} />
                  Safe Automated Cleanup
                </Button>
              </div>
            </div>

            {/* Vault Search & List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search vault by title, author, or reason..."
                    value={vaultSearchQuery}
                    onChange={(e) => setVaultSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => { void refetchVault(); }} className="gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${vaultLoading ? 'animate-spin' : ''}`} />
                  Refresh Vault
                </Button>
              </div>

              {vaultLoading ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : archivedBooks.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No books currently archived</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All catalog books are currently active in the public library. When you archive unwanted or redundant books, they will be safely kept here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Book Info</th>
                        <th className="p-3">Archived Date</th>
                        <th className="p-3">Archive Reason</th>
                        <th className="p-3">ID & Details</th>
                        <th className="p-3 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {archivedBooks
                        .filter((b) => {
                          if (!vaultSearchQuery.trim()) return true;
                          const q = vaultSearchQuery.toLowerCase();
                          return (
                            b.title.toLowerCase().includes(q) ||
                            (b.author && b.author.toLowerCase().includes(q)) ||
                            (b.archive_reason && b.archive_reason.toLowerCase().includes(q)) ||
                            b.id.toLowerCase().includes(q)
                          );
                        })
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/60">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {b.cover_image_url ? (
                                  <img
                                    src={b.cover_image_url}
                                    alt={b.title}
                                    className="w-9 h-12 object-cover rounded shadow-xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400 shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-900 line-clamp-1">{b.title}</div>
                                  <div className="text-[11px] text-slate-500">{b.author || 'Unknown Author'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-500">
                              {new Date(b.archived_at).toLocaleString()}
                            </td>
                            <td className="p-3 max-w-xs">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                                {b.archive_reason || 'Archived record'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-mono text-[10px] text-slate-500">{b.id}</div>
                              <div className="text-[10px] text-slate-400">
                                {b.publication_year ? `Year: ${b.publication_year} ` : ''}
                                {b.language ? `Lang: ${b.language.toUpperCase()}` : ''}
                              </div>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                                onClick={() => handleRestoreFromVault(b.id)}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Bring Back to Library
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview & Execution Confirmation Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Preview Changes Before Approval
            </DialogTitle>
            <DialogDescription>
              Review the exact catalog mutation and reference migrations before committing.
            </DialogDescription>
          </DialogHeader>

          {previewResult && selectedGroup && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900">Action: {selectedAction}</div>
                <div className="text-slate-600">
                  Target Group: <span className="font-bold text-slate-800">{selectedGroup.clusterTitle}</span>
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
                      <strong className="text-slate-900">{previewResult.archivedBookIds.length} redundant books</strong> will be soft-archived (hidden from search, safely preserved in database).
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
                      <strong className="text-slate-900">All user shelves & progress</strong> referencing redundant IDs will be transactionally re-parented to the primary edition.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This operation is repeat-safe and fully reversible via the Audit History tab.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={isExecuting}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={handleConfirmExecute}
              disabled={isExecuting}
            >
              {isExecuting ? 'Applying...' : 'Approve & Execute Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Unwanted Book Modal */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleArchiveSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" />
                Archive Unwanted Book
              </DialogTitle>
              <DialogDescription>
                Move a book into the hidden archive vault. It will be removed from user view but preserved safely for future restoration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="unwanted-book-id" className="font-semibold text-slate-800">Book ID (UUID)</label>
                <Input
                  id="unwanted-book-id"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={unwantedBookId}
                  onChange={(e) => setUnwantedBookId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="archive-reason-input" className="font-semibold text-slate-800">Archive Reason</label>
                <Input
                  id="archive-reason-input"
                  placeholder="e.g. Poor scan quality / Duplicate entry / Requested removal"
                  value={archiveReasonInput}
                  onChange={(e) => setArchiveReasonInput(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Non-destructive action
                </div>
                <p>
                  This will not delete the book row permanently or break user shelves. The book is safely transferred to <code>books_library_archive</code> and hidden from all public searches. You can restore it anytime with one click.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsArchiveModalOpen(false)}
                disabled={isArchiving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={isArchiving || !unwantedBookId.trim()}
              >
                {isArchiving ? 'Archiving...' : 'Move to Archive Vault'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLibraryQuality;

