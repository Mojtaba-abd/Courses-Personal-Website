import certificateModel from "../models/certificate-model.js";

export const getAllCertificates = async (req, res) => {
  try {
    const query = req.user && req.user.role === "admin" ? {} : { isPublished: true };
    const certificates = await certificateModel.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json(certificates);
  } catch (error) {
    console.error("Get certificates error:", error);
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
    const certificate = await certificateModel.findByIdAndDelete(certificateId);

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Delete certificate error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete certificate" });
  }
};

