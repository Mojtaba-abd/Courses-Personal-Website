"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Certificate {
  _id?: string;
  id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  certificateUrl?: string;
  imageUrl: string;
  description?: string;
}

interface CertificatesGridProps {
  certificates: Certificate[];
}

export const CertificatesGrid = ({ certificates }: CertificatesGridProps) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleCertificateClick = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setDialogOpen(true);
  };

  if (certificates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => {
          const certId = cert._id || cert.id || "";
          return (
            <Card
              key={certId}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => handleCertificateClick(cert)}
            >
              <div className="relative aspect-video bg-muted">
                {cert.imageUrl ? (
                  <Image
                    src={cert.imageUrl}
                    alt={cert.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{cert.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{cert.issuer}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(cert.issueDate)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Certificate Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCertificate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCertificate.title}</DialogTitle>
                <DialogDescription>
                  Issued by {selectedCertificate.issuer} on {formatDate(selectedCertificate.issueDate)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedCertificate.imageUrl && (
                  <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={selectedCertificate.imageUrl}
                      alt={selectedCertificate.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                {selectedCertificate.description && (
                  <p className="text-sm text-muted-foreground">{selectedCertificate.description}</p>
                )}
                {selectedCertificate.certificateUrl && (
                  <Button
                    variant="outline"
                    asChild
                    className="w-full"
                  >
                    <a
                      href={selectedCertificate.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Credential
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

