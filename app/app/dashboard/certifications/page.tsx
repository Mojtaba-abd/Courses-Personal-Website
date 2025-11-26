"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, Trash2, Edit2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ImageIcon, X } from "lucide-react";

interface Certificate {
  _id?: string;
  id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  certificateUrl: string;
  imageUrl: string;
  description?: string;
  isPublished?: boolean;
}

const CertificationsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [deletingCertificate, setDeletingCertificate] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (user?.role === "admin") {
      fetchCertificates();
    }
  }, [user, authLoading, router]);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/certificates`, {
        withCredentials: true,
      });
      setCertificates(response.data || []);
    } catch (error: any) {
      console.error("Error fetching certificates:", error);
      toast.error(error.response?.data?.error || "Failed to load certificates");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCertificate(null);
    setImageUrl("");
    setImagePreview("");
    setCreateDialogOpen(true);
  };

  const openEditDialog = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    const url = certificate.imageUrl || "";
    setImageUrl(url);
    setImagePreview(url);
    setEditDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = response.data.url;
      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImagePreview("");
  };

  const openDeleteDialog = (certificate: Certificate) => {
    setDeletingCertificate(certificate);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const issuer = formData.get("issuer") as string;
    const issueDate = formData.get("issueDate") as string;
    const certificateUrl = formData.get("certificateUrl") as string;
    const description = formData.get("description") as string;
    
    // Use state imageUrl if form doesn't have it
    const finalImageUrl = imageUrl || (formData.get("imageUrl") as string);
    
    if (!finalImageUrl) {
      toast.error("Please upload a certificate image");
      return;
    }

    try {
      if (editingCertificate) {
        const certId = editingCertificate._id || editingCertificate.id || "";
        await axios.put(
          `${API_URL}/api/certificates/${certId}`,
          { title, issuer, issueDate, certificateUrl, imageUrl: finalImageUrl, description },
          { withCredentials: true }
        );
        toast.success("Certificate updated successfully");
        setEditDialogOpen(false);
      } else {
        await axios.post(
          `${API_URL}/api/certificates`,
          { title, issuer, issueDate, certificateUrl, imageUrl: finalImageUrl, description },
          { withCredentials: true }
        );
        toast.success("Certificate created successfully");
        setCreateDialogOpen(false);
      }
      fetchCertificates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save certificate");
    }
  };

  const handleDelete = async () => {
    if (!deletingCertificate) return;

    setIsDeleting(true);
    try {
      const certId = deletingCertificate._id || deletingCertificate.id || "";
      await axios.delete(`${API_URL}/api/certificates/${certId}`, {
        withCredentials: true,
      });
      toast.success("Certificate deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCertificate(null);
      fetchCertificates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete certificate");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Certifications</h1>
          <p className="text-gray-400">Manage your professional certificates</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="text-gray-300">Image</TableHead>
                <TableHead className="text-gray-300">Title</TableHead>
                <TableHead className="text-gray-300">Issuer</TableHead>
                <TableHead className="text-gray-300">Issue Date</TableHead>
                <TableHead className="text-gray-300">Credential URL</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    No certificates found. Click "Add Certificate" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => {
                  const certId = cert._id || cert.id || "";
                  return (
                    <TableRow key={certId} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell>
                        {cert.imageUrl ? (
                          <div className="relative w-16 h-16">
                            <Image
                              src={cert.imageUrl}
                              alt={cert.title}
                              fill
                              sizes="100vw"
                              className="object-cover rounded"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-white">{cert.title}</TableCell>
                      <TableCell className="text-gray-300">{cert.issuer || "N/A"}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(cert.issueDate)}</TableCell>
                      <TableCell>
                        {cert.certificateUrl ? (
                          <a
                            href={cert.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-cyan-500 hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cert)}
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(cert)}
                            className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Certificate Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setEditingCertificate(null);
            setImageUrl("");
            setImagePreview("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCertificate ? "Edit Certificate" : "Add Certificate"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingCertificate
                  ? "Update certificate information"
                  : "Add a new professional certificate"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Cisco CCNA"
                  required
                  defaultValue={editingCertificate?.title || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issuer" className="text-white">Issuer *</Label>
                <Input
                  id="issuer"
                  name="issuer"
                  placeholder="e.g., Cisco"
                  required
                  defaultValue={editingCertificate?.issuer || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueDate" className="text-white">Issue Date *</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={
                    editingCertificate?.issueDate
                      ? new Date(editingCertificate.issueDate).toISOString().split("T")[0]
                      : ""
                  }
                  className="bg-[#0f0f0f] border-gray-800 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateUrl" className="text-white">Credential URL (optional)</Label>
                <Input
                  id="certificateUrl"
                  name="certificateUrl"
                  type="url"
                  placeholder="https://www.credly.com/badges/..."
                  defaultValue={editingCertificate?.certificateUrl || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-white">Description (optional)</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the certificate..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                  defaultValue={editingCertificate?.description || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificate-image" className="text-white">Certificate Image *</Label>
                {imagePreview ? (
                  <div className="relative w-full h-48 mb-2 border border-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Certificate preview"
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-800 rounded-lg bg-[#0f0f0f] hover:bg-gray-900 transition-colors">
                    <label
                      htmlFor="certificate-image"
                      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                    >
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">
                        {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                    <input
                      id="certificate-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
                {!imagePreview && (
                  <input
                    type="file"
                    id="certificate-image-alt"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                )}
                <input type="hidden" name="imageUrl" value={imageUrl} />
                <p className="text-xs text-muted-foreground">
                  Upload a clear image of your certificate
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setEditingCertificate(null);
                  setImageUrl("");
                  setImagePreview("");
                }}
                className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the certificate
              "{deletingCertificate?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CertificationsPage;

