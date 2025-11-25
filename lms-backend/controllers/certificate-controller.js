import certificateModel from "../models/certificate-model.js";
import fs from "fs";
import path from "path";

export const getAllCertificates = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === "admin") {
      // Admin can see all certificates
      query = {};
    } else {
      // Non-admin users see only published certificates
      query = {
        $or: [
          { isPublished: true },
          { published: true },
          { isPublished: { $exists: false }, published: { $exists: false } }
        ]
      };
    }
    const certificates = await certificateModel.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) {
    console.error("Get certificates error:", error);
    return res.status(500).json({ error: error.message || "Failed to get certificates" });
  }
};

// Public route - no auth required, returns only published certificates
export const getPublicCertificates = async (req, res) => {
  try {
    // First, check total certificates in database
    const totalCertificates = await certificateModel.find({});
    console.log(`📊 Total certificates in DB: ${totalCertificates.length}`);
    
    if (totalCertificates.length > 0) {
      const sample = totalCertificates[0];
      console.log(`📊 Sample certificate:`, {
        id: sample._id,
        title: sample.title,
        isPublished: sample.isPublished,
        published: sample.published,
        hasIsPublished: 'isPublished' in sample,
        hasPublished: 'published' in sample
      });
      
      // Log all certificates' published status
      totalCertificates.forEach((cert, idx) => {
        console.log(`  Certificate ${idx + 1}: "${cert.title}" - isPublished: ${cert.isPublished}`);
      });
    }
    
    // Query for published certificates (or all if none are published - for development)
    let query = {
      $or: [
        { isPublished: true },
        { published: true },
        // If neither field exists, consider it published (for backward compatibility)
        { isPublished: { $exists: false }, published: { $exists: false } }
      ]
    };
    
    let certificates = await certificateModel.find(query).sort({ order: 1, createdAt: -1 });
    console.log(`📋 Found ${certificates.length} published certificates`);
    
    // For development: if no published certificates exist, return all (temporary)
    if (certificates.length === 0 && totalCertificates.length > 0) {
      console.log(`⚠️  No published certificates found. Returning all certificates for development.`);
      certificates = await certificateModel.find({}).sort({ order: 1, createdAt: -1 });
    }
    
    console.log(`✅ Returning ${certificates.length} certificates`);
    res.status(200).json(certificates);
  } catch (error) {
    console.error("❌ Get public certificates error:", error);
    return res.status(500).json({ error: error.message || "Failed to get certificates" });
  }
};

export const getOneCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await certificateModel.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    if (!certificate.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.status(200).json(certificate);
  } catch (error) {
    console.error("Get certificate error:", error);
    return res.status(500).json({ error: error.message || "Failed to get certificate" });
  }
};

export const createCertificate = async (req, res) => {
  try {
    const certificate = await certificateModel.create(req.body);
    res.status(201).json(certificate);
  } catch (error) {
    console.error("Create certificate error:", error);
    return res.status(500).json({ error: error.message || "Failed to create certificate" });
  }
};

export const updateCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await certificateModel.findByIdAndUpdate(
      certificateId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.status(200).json(certificate);
  } catch (error) {
    console.error("Update certificate error:", error);
    return res.status(500).json({ error: error.message || "Failed to update certificate" });
  }
};

export const deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Get certificate first to access imageUrl before deleting
    const certificate = await certificateModel.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Delete the image file if it exists
    if (certificate.imageUrl) {
      try {
        // Extract filename from imageUrl (could be full URL or relative path)
        // Examples: "http://localhost:8000/uploads/filename.jpg" or "/uploads/filename.jpg"
        let filename = certificate.imageUrl;
        
        // If it's a full URL, extract just the path part
        if (filename.includes("/uploads/")) {
          filename = filename.split("/uploads/")[1];
        } else if (filename.startsWith("/uploads/")) {
          filename = filename.replace("/uploads/", "");
        }

        if (filename) {
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, filename);
          
          // Check if file exists and delete it
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted certificate image file: ${filename}`);
          }
        }
      } catch (fileError) {
        // Log error but don't fail the delete operation
        console.error("Error deleting certificate image file:", fileError);
      }
    }

    // Delete certificate from database
    await certificateModel.findByIdAndDelete(certificateId);

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Delete certificate error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete certificate" });
  }
};

