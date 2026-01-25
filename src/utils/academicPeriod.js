export function getCurrentAcademicPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12

  // Adjust months to your school calendar if needed
  let term = "First Term";
  if (month >= 1 && month <= 4) term = "Second Term";
  if (month >= 5 && month <= 8) term = "Third Term";

  const session =
    month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;

  return { session, term };
}
