export function exportPaymentsToCSV() {
  const paystack =
    JSON.parse(localStorage.getItem("schoolPortalPayments")) || [];

  const manual =
    JSON.parse(localStorage.getItem("schoolPortalPaymentRequests")) || [];

  let csv = "";

  // 🔹 PAYSTACK SHEET
  csv += "PAYSTACK PAYMENTS\n";
  csv += "Date,Payer,Purpose,Amount,Status,Reference\n";

  paystack.forEach(p => {
    csv += [
      new Date(p.createdAt).toLocaleDateString(),
      p.payerName,
      p.purpose || "School Payment",
      p.amount,
      p.status,
      p.reference
    ].join(",") + "\n";
  });

  csv += "\n\n";

  // 🔹 MANUAL SHEET
  csv += "MANUAL PAYMENTS\n";
  csv += "Date,Student,Amount,Status,Method\n";

  manual.forEach(p => {
    csv += [
      new Date(p.createdAt).toLocaleDateString(),
      p.studentId,
      p.amount,
      p.status,
      p.method || "cash"
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "BAC_All_Payments.csv";
  a.click();
}
