import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Summary = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categories: { category: string; spent: number; budget: number }[];
};

function fmt(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export async function generatePDFReport(
  summary: Summary,
  persona: string
) {
  const doc = new jsPDF();
  const monthName = new Date(summary.year, summary.month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const personaLabel =
    persona === "STUDENT"
      ? "Student"
      : persona === "INVESTOR"
      ? "Investor"
      : "Young Professional";

  const primaryGreen: [number, number, number] = [16, 185, 129];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const lightGray: [number, number, number] = [248, 250, 252];

  // Header bar
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Personal Finance Report", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${monthName}  •  ${personaLabel}`, 14, 30);

  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, 150, 30);

  // Summary cards row
  const cards = [
    { label: "Total Income", value: fmt(summary.totalIncome), color: [220, 252, 231] as [number, number, number] },
    { label: "Total Expenses", value: fmt(summary.totalExpenses), color: [254, 226, 226] as [number, number, number] },
    { label: "Net Balance", value: fmt(summary.netBalance), color: summary.netBalance >= 0 ? ([220, 252, 231] as [number, number, number]) : ([254, 226, 226] as [number, number, number]) },
    {
      label: "Savings Rate",
      value: summary.totalIncome > 0 ? `${Math.max(0, Math.round(((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100))}%` : "—",
      color: [219, 234, 254] as [number, number, number],
    },
  ];

  const cardW = 43;
  const cardX = 14;
  const cardY = 50;
  cards.forEach((card, i) => {
    const x = cardX + i * (cardW + 5);
    doc.setFillColor(...card.color);
    doc.roundedRect(x, cardY, cardW, 24, 3, 3, "F");
    doc.setTextColor(...darkSlate);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label.toUpperCase(), x + 4, cardY + 7);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + 4, cardY + 17);
  });

  // Category breakdown table
  doc.setTextColor(...darkSlate);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Spending by Category", 14, 90);

  const tableRows = summary.categories.map((c) => [
    c.category,
    fmt(c.spent),
    c.budget > 0 ? fmt(c.budget) : "—",
    c.budget > 0 ? `${Math.round((c.spent / c.budget) * 100)}%` : "—",
    c.budget > 0 && c.spent > c.budget ? "Over budget" : c.budget > 0 && c.spent / c.budget > 0.8 ? "Near limit" : "On track",
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Category", "Spent", "Budget", "Usage", "Status"]],
    body: tableRows.length > 0 ? tableRows : [["No data", "—", "—", "—", "—"]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: primaryGreen, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: lightGray },
    columnStyles: {
      4: {
        fontStyle: "bold",
        textColor: (cell: any) => {
          const v = cell.raw as string;
          return v === "Over budget" ? [220, 38, 38] : v === "Near limit" ? [202, 138, 4] : [22, 163, 74];
        },
      },
    },
  });

  // Financial tips section
  const finalY = (doc as any).lastAutoTable?.finalY ?? 160;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  doc.text("Financial Tips", 14, finalY + 14);

  const tips =
    persona === "STUDENT"
      ? ["Build an emergency fund covering 1 month of expenses first.", "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.", "Track every small purchase — small amounts add up fast."]
      : persona === "INVESTOR"
      ? ["Maximize your savings rate — every ₦ saved today compounds.", "Review investment allocations quarterly.", "Keep 3–6 months of expenses as liquid emergency fund."]
      : ["Aim for a savings rate of at least 20% of income.", "Set up automatic transfers to savings on payday.", "Review budget categories monthly and adjust limits."];

  tips.forEach((tip, i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`${i + 1}. ${tip}`, 14, finalY + 24 + i * 8);
  });

  // Footer
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 282, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("FinanceTracker — Powered by AI  •  Confidential", 14, 291);
  doc.text(`Page 1 of 1`, 180, 291);

  doc.save(`finance-report-${monthName.replace(" ", "-")}.pdf`);
}
