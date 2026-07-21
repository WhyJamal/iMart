export async function uploadProductImage(file: File, oldPath?: string) {
  const formData = new FormData();
  formData.append("file", file);

  if (oldPath) {
    formData.append("oldPath", oldPath);
  }

  const res = await fetch("/api/upload/product", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json() as Promise<{ url: string }>;
}