"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { toast } from "sonner";

// --- Types ---

interface CMSPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
}

// --- Pages Tab ---

function PagesTab() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CMSPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    is_published: false,
  });

  const fetchPages = async () => {
    try {
      const response = await api.get("/admin/content/pages/");
      setPages(response.data.results || response.data);
    } catch (error) {
      toast.error("Failed to load pages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleEdit = (page: CMSPage) => {
    setEditing(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      is_published: page.is_published,
    });
  };

  const handleNew = () => {
    setEditing({
      id: 0,
      title: "",
      slug: "",
      content: "",
      is_published: false,
      updated_at: "",
    });
    setFormData({ title: "", slug: "", content: "", is_published: false });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Title and slug are required.");
      return;
    }

    setSaving(true);
    try {
      if (editing && editing.id > 0) {
        await api.put(`/admin/content/pages/${editing.id}/`, formData);
        toast.success("Page updated successfully.");
      } else {
        await api.post("/admin/content/pages/", formData);
        toast.success("Page created successfully.");
      }
      setEditing(null);
      fetchPages();
    } catch (error) {
      toast.error("Failed to save page.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await api.delete(`/admin/content/pages/${id}/`);
      toast.success("Page deleted successfully.");
      fetchPages();
    } catch (error) {
      toast.error("Failed to delete page.");
    }
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editing.id > 0 ? "Edit Page" : "New Page"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-slug">Slug</Label>
                <Input
                  id="page-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="page-slug"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-content">Content</Label>
              <Textarea
                id="page-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Page content..."
                rows={12}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_published: checked }))
                }
              />
              <Label htmlFor="page-published">Published</Label>
            </div>
            <Button
              className="w-full"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pages
          </CardTitle>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-1 h-4 w-4" />
            New Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No pages found. Create your first page.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="font-mono text-sm">
                    /{page.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.is_published ? "success" : "secondary"}>
                      {page.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(page.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- FAQ Tab ---

function FAQTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: 0,
    is_active: true,
  });

  const fetchFaqs = async () => {
    try {
      const response = await api.get("/admin/content/faq/");
      setFaqs(response.data.results || response.data);
    } catch (error) {
      toast.error("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleEdit = (faq: FAQ) => {
    setEditing(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      is_active: faq.is_active,
    });
  };

  const handleNew = () => {
    setEditing({
      id: 0,
      question: "",
      answer: "",
      category: "",
      order: 0,
      is_active: true,
    });
    setFormData({
      question: "",
      answer: "",
      category: "",
      order: 0,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }

    setSaving(true);
    try {
      if (editing && editing.id > 0) {
        await api.put(`/admin/content/faq/${editing.id}/`, formData);
        toast.success("FAQ updated successfully.");
      } else {
        await api.post("/admin/content/faq/", formData);
        toast.success("FAQ created successfully.");
      }
      setEditing(null);
      fetchFaqs();
    } catch (error) {
      toast.error("Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await api.delete(`/admin/content/faq/${id}/`);
      toast.success("FAQ deleted successfully.");
      fetchFaqs();
    } catch (error) {
      toast.error("Failed to delete FAQ.");
    }
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editing.id > 0 ? "Edit FAQ" : "New FAQ"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question</Label>
              <Input
                id="faq-question"
                value={formData.question}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="What is the question?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea
                id="faq-answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Provide the answer..."
                rows={5}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="faq-category">Category</Label>
                <Input
                  id="faq-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="e.g., General, Financing, Payments"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-order">Display Order</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="faq-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="faq-active">Active</Label>
            </div>
            <Button
              className="w-full"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save FAQ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            FAQs
          </CardTitle>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-1 h-4 w-4" />
            New FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No FAQs found. Create your first FAQ entry.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {faq.question}
                  </TableCell>
                  <TableCell>{faq.category || "Uncategorized"}</TableCell>
                  <TableCell>{faq.order}</TableCell>
                  <TableCell>
                    <Badge variant={faq.is_active ? "success" : "secondary"}>
                      {faq.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(faq)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(faq.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Content Page ---

export default function AdminContentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage CMS pages and FAQ entries.
        </p>
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pages" className="mt-4">
          <PagesTab />
        </TabsContent>
        <TabsContent value="faq" className="mt-4">
          <FAQTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
