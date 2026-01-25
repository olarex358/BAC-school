import React from "react";
import StudentTermResult from "../StudentTermResult";

export default function BatchResultSlipPrint({
  students = [],
  term,
  year,
}) {
  return (
    <div>
      {students.map((student) => (
        <div
          key={student.admissionNo}
          style={{ pageBreakAfter: "always" }}
        >
          <StudentTermResult
            batchMode={true}
            batchStudent={student}
            batchTerm={term}
            batchYear={year}
          />
        </div>
      ))}
    </div>
  );
}
