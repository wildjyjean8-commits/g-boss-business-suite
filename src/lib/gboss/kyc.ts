import { supabase } from "@/integrations/supabase/client";

export type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type KycDocumentType = "cin" | "paspò";

export type KycSubmission = {
  id: string;
  businessId: string;
  documentType: KycDocumentType;
  status: KycStatus | "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  submittedAt: string;
};

export async function fetchLatestKycSubmission(businessId: string): Promise<KycSubmission | null> {
  const { data, error } = await supabase
    .from("business_kyc_submissions")
    .select("id, business_id, document_type, status, rejection_reason, submitted_at")
    .eq("business_id", businessId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[kyc] echèk chajman dènye soumisyon KYC", error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    documentType: data.document_type as KycDocumentType,
    status: data.status as KycStatus,
    rejectionReason: data.rejection_reason,
    submittedAt: data.submitted_at,
  };
}

export async function submitKyc(
  businessId: string,
  userId: string,
  documentType: KycDocumentType,
  idFile: File,
  selfieFile: File,
): Promise<void> {
  const idExt = idFile.name.split(".").pop() ?? "jpg";
  const selfieExt = selfieFile.name.split(".").pop() ?? "jpg";
  const idPath = `${businessId}/id-doc-${Date.now()}.${idExt}`;
  const selfiePath = `${businessId}/selfie-${Date.now()}.${selfieExt}`;

  const [idUpload, selfieUpload] = await Promise.all([
    supabase.storage.from("kyc-documents").upload(idPath, idFile),
    supabase.storage.from("kyc-documents").upload(selfiePath, selfieFile),
  ]);

  if (idUpload.error) throw idUpload.error;
  if (selfieUpload.error) throw selfieUpload.error;

  const { error } = await supabase.from("business_kyc_submissions").insert({
    business_id: businessId,
    id_document_url: idPath,
    selfie_url: selfiePath,
    document_type: documentType,
    submitted_by: userId,
  });

  if (error) throw error;
}

export type PendingKycSubmission = {
  id: string;
  businessId: string;
  businessName: string;
  documentType: KycDocumentType;
  submittedAt: string;
  idDocumentUrl: string;
  selfieUrl: string;
};

export async function fetchPendingKycSubmissions(): Promise<PendingKycSubmission[]> {
  const { data, error } = await supabase
    .from("business_kyc_submissions")
    .select("id, business_id, document_type, submitted_at, id_document_url, selfie_url, businesses(name)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) {
    console.error("[kyc] echèk chajman demand an atant yo", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    businessName: (row.businesses as { name: string } | null)?.name ?? row.business_id,
    documentType: row.document_type as KycDocumentType,
    submittedAt: row.submitted_at,
    idDocumentUrl: row.id_document_url,
    selfieUrl: row.selfie_url,
  }));
}

export async function getKycDocumentSignedUrls(
  idDocumentUrl: string,
  selfieUrl: string,
): Promise<{ id: string | null; selfie: string | null }> {
  const [idSigned, selfieSigned] = await Promise.all([
    supabase.storage.from("kyc-documents").createSignedUrl(idDocumentUrl, 600),
    supabase.storage.from("kyc-documents").createSignedUrl(selfieUrl, 600),
  ]);
  return {
    id: idSigned.data?.signedUrl ?? null,
    selfie: selfieSigned.data?.signedUrl ?? null,
  };
}

export async function reviewKycSubmission(
  submissionId: string,
  reviewerId: string,
  status: "approved" | "rejected",
  rejectionReason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("business_kyc_submissions")
    .update({
      status,
      rejection_reason: rejectionReason ?? null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw error;
}
