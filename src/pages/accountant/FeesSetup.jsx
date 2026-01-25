import { useState } from "react";
import useLocalStorage from "../../hooks/useLocalStorage";
import SessionTermSelector from "../../components/SessionTermSelector";
import { getCurrentAcademicPeriod } from "../../utils/academicPeriod";

function FeesSetup() {
  const [fees, setFees] = useLocalStorage("schoolPortalFeeRecords", []);

  // ✅ Hooks INSIDE component (correct)
  const [form, setForm] = useState({
    className: "",
    amount: ""
  });

  const [period, setPeriod] = useState(getCurrentAcademicPeriod());

  const saveFee = () => {
    if (
      !form.className ||
      !period.term ||
      !period.session ||
      !form.amount
    ) {
      return;
    }

    setFees(prev => [
      ...prev,
      {
        id: Date.now(),
        class: form.className,
        session: period.session,
        term: period.term,
        amount: Number(form.amount),
        basedOn: "Class",
        paidAmount: 0,
        status: "Unpaid",
        isGeneralFee: true
      }
    ]);

    setForm({ className: "", amount: "" });
  };

  return (
    <div className="content-section">
      <h2>Set Fees</h2>

      <input
        placeholder="Class"
        value={form.className}
        onChange={e =>
          setForm({ ...form, className: e.target.value })
        }
      />

      <SessionTermSelector
        value={period}
        onChange={setPeriod}
      />

      <input
        type="number"
        placeholder="Amount"
        value={form.amount}
        onChange={e =>
          setForm({ ...form, amount: e.target.value })
        }
      />

      <button onClick={saveFee}>Save Fee</button>
    </div>
  );
}

export default FeesSetup;
