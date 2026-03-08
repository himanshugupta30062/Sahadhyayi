import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArticle } from '@/hooks/useArticles';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Send, Save, X, ImagePlus, PenLine, HelpCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import DOMPurify from 'dompurify';
import { z } from 'zod';
import RichTextToolbar from '@/components/articles/RichTextToolbar';
import MarkdownPreview from '@/components/articles/MarkdownPreview';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const articleSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  subtitle: z.string().trim().max(300, 'Subtitle too long').optional(),
  content: z.string().trim().min(50, 'Article must be at least 50 characters'),
  tags: z.array(z.string().max(30)).max(5, 'Max 5 tags'),
});

const ArticleWrite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createArticle = useCreateArticle();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) {
    navigate('/signin');
    return null;
  }

  // Insert text around selection (for inline formatting)
  const handleInsert = useCallback((before: string, after: string, placeholder?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const insertText = selectedText || placeholder || '';
    const newContent = content.substring(0, start) + before + insertText + after + content.substring(end);
    setContent(newContent);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + before.length + insertText.length;
      if (!selectedText && placeholder) {
        // Select the placeholder so user can type over it
        textarea.setSelectionRange(start + before.length, cursorPos);
      } else {
        textarea.setSelectionRange(cursorPos + after.length, cursorPos + after.length);
      }
    });
  }, [content]);

  // Wrap selected lines with a prefix (for headings, lists, quotes)
  const handleWrapLines = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find line boundaries
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? content.length : lineEnd;

    const selectedLines = content.substring(lineStart, actualEnd);
    const prefixed = selectedLines
      .split('\n')
      .map((line) => {
        // If already has this prefix, remove it (toggle)
        if (line.startsWith(prefix)) return line.slice(prefix.length);
        // Remove other heading prefixes if applying a heading
        if (prefix.startsWith('#')) {
          return prefix + line.replace(/^#{1,3}\s/, '');
        }
        return prefix + line;
      })
      .join('\n');

    const newContent = content.substring(0, lineStart) + prefixed + content.substring(actualEnd);
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
    });
  }, [content]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        handleInsert('**', '**', 'bold text');
      } else if (e.key === 'i') {
        e.preventDefault();
        handleInsert('*', '*', 'italic text');
      } else if (e.key === 'k') {
        e.preventDefault();
        handleInsert('[', '](url)', 'link text');
      }
    }
    // Tab inserts 2 spaces instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      handleInsert('  ', '', '');
    }
  }, [handleInsert]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const handleSave = async (publish: boolean) => {
    const result = articleSchema.safeParse({ title, subtitle, content, tags });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    await createArticle.mutateAsync({
      title: DOMPurify.sanitize(title.trim()),
      subtitle: subtitle.trim() ? DOMPurify.sanitize(subtitle.trim()) : undefined,
      content: DOMPurify.sanitize(content.trim()),
      tags,
      cover_image_url: coverUrl.trim() || undefined,
      is_published: publish,
    });

    navigate(publish ? '/articles' : '/articles/my');
  };

  return (
    <>
      <SEO title="Write Article - Sahadhyayi" description="Write and share your article with the Sahadhyayi community." />
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {wordCount} words · {readingTime} min read
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="gap-1">
                {preview ? <PenLine className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {preview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={createArticle.isPending}
                className="gap-1"
              >
                <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save Draft</span>
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={createArticle.isPending}
                className="bg-brand-primary text-white gap-1"
              >
                <Send className="w-4 h-4" /> Publish
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {preview ? (
            /* Preview mode */
            <div>
              {coverUrl && (
                <img src={coverUrl} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />
              )}
              <h1 className="text-4xl font-bold text-foreground mb-2">{title || 'Untitled'}</h1>
              {subtitle && <p className="text-xl text-muted-foreground mb-6">{subtitle}</p>}
              <div className="flex gap-2 mb-6">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
              <MarkdownPreview content={content} />
            </div>
          ) : (
            /* Editor */
            <div className="space-y-6">
              {/* Cover image */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Cover Image URL (optional)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" className="shrink-0">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
                {coverUrl && (
                  <img src={coverUrl} alt="" className="mt-2 w-full h-48 object-cover rounded-lg" />
                )}
              </div>

              {/* Title */}
              <div>
                <Input
                  placeholder="Article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/40 h-auto py-2"
                  maxLength={200}
                />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
              </div>

              {/* Subtitle */}
              <Input
                placeholder="Add a subtitle (optional)..."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="text-lg border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/40 h-auto py-1"
                maxLength={300}
              />

              {/* Formatting toolbar + content area */}
              <div>
                <div className="flex items-center justify-between">
                  <RichTextToolbar
                    textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                    onInsert={handleInsert}
                    onWrapLines={handleWrapLines}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Markdown Shortcuts</p>
                        <p><kbd className="px-1 bg-muted rounded">Ctrl+B</kbd> Bold</p>
                        <p><kbd className="px-1 bg-muted rounded">Ctrl+I</kbd> Italic</p>
                        <p><kbd className="px-1 bg-muted rounded">Ctrl+K</kbd> Link</p>
                        <p><code># Heading 1</code> · <code>## Heading 2</code></p>
                        <p><code>- item</code> bullets · <code>1. item</code> numbered</p>
                        <p><code>&gt; quote</code> · <code>```code```</code></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  ref={textareaRef}
                  placeholder="Tell your story... Use the toolbar above or Markdown syntax for formatting."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[450px] text-base border border-border border-t-0 rounded-t-none shadow-none focus-visible:ring-1 focus-visible:ring-brand-primary resize-none leading-relaxed font-mono placeholder:font-sans placeholder:text-muted-foreground/40 p-4"
                />
                {errors.content && <p className="text-sm text-destructive mt-1">{errors.content}</p>}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Supports Markdown formatting</span>
                  <span>{wordCount} words · ~{readingTime} min read</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags (up to 5)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(t)}>
                      {t} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    maxLength={30}
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={addTag} disabled={tags.length >= 5}>
                    Add
                  </Button>
                </div>
                {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArticleWrite;
