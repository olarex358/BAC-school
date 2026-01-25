// src/pages/ViewReports.js
import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';

function ViewReports() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  
  // Update hooks to get data from the backend
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');
  const [results] = useLocalStorage('schoolPortalResults', [], 'http://localhost:5000/api/schoolPortalResults');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  
  const [reportClassSelect, setReportClassSelect] = useState('');
  const [reportStudentSelect, setReportStudentSelect] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportMessage, setReportMessage] = useState(null);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && (user.type === 'admin' || user.type === 'staff')) {
      setLoggedInUser(user);
    } else {
      navigate('/login');
    }
  }, []);
  
  const getGrade = (totalScore) => {
    if (totalScore >= 70) return 'A';
    if (totalScore >= 60) return 'B';
    if (totalScore >= 50) return 'C';
    if (totalScore >= 40) return 'D';
    return 'F';
  };

  const getStudentName = (admissionNo) => {
    const student = students.find(s => s.admissionNo === admissionNo);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };
  
  const getStudentContact = (admissionNo) => {
    const student = students.find(s => s.admissionNo === admissionNo);
    return {
      email: student?.contactEmail || 'student@example.com',
      whatsapp: student?.contactPhone || '1234567890'
    };
  };
  
  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : 'Unknown Subject';
  };

  const generateIndividualReport = () => {
    setReportMessage(null);
    if (!reportStudentSelect) {
      setReportMessage({ type: 'error', text: 'Please select a student to generate an individual report.' });
      setGeneratedReport(null);
      return;
    }
    const student = students.find(s => s.admissionNo === reportStudentSelect);
    if (!student) {
      setReportMessage({ type: 'error', text: 'Student not found.' });
      setGeneratedReport(null);
      return;
    }
    const studentResults = results.filter(r => r.studentNameSelect === reportStudentSelect);
    let reportHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h3 style="color: #333;">Individual Report for ${student.firstName} ${student.lastName} (${student.admissionNo})</h3>
      <p><strong>Class:</strong> ${student.studentClass}</p>
      <h4 style="margin-top: 20px; color: #555;">Results:</h4>
    `;
    if (studentResults.length > 0) {
      reportHtml += `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Subject</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Term</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">1st CA (10%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">2nd CA (10%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Assignment (20%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Exam (60%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Total (100%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Grade</th>
            </tr>
          </thead>
          <tbody>
      `;
      studentResults.forEach(r => {
        const { total, grade } = { total: r.totalScore, grade: r.grade };
        reportHtml += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${getSubjectName(r.subjectSelect)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.termSelect}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.firstCaScore}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.secondCaScore}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.assignmentScore}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.examScore}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${total}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${grade}</strong></td>
          </tr>
        `;
      });
      reportHtml += `
          </tbody>
        </table>
      `;
    } else {
      reportHtml += `<p style="color: #888;">No results found for this student.</p>`;
    }
    reportHtml += `</div>`;
    setGeneratedReport(<div dangerouslySetInnerHTML={{ __html: reportHtml }} />);
  };
  
  const generateClassReport = () => {
    setReportMessage(null);
    if (!reportClassSelect) {
      setReportMessage({ type: 'error', text: 'Please select a class to generate a class report.' });
      setGeneratedReport(null);
      return;
    }
    const studentsInClass = students.filter(s => s.studentClass === reportClassSelect);
    if (studentsInClass.length === 0) {
      setReportMessage({ type: 'error', text: 'No students found in this class.' });
      setGeneratedReport(null);
      return;
    }
    let reportHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h3 style="color: #333;">Class Report for ${reportClassSelect}</h3>
    `;
    studentsInClass.forEach(student => {
      const studentResults = results.filter(r => r.studentNameSelect === student.admissionNo);
      reportHtml += `
        <h4 style="margin-top: 25px; color: #555;">${student.firstName} ${student.lastName} (${student.admissionNo})</h4>
      `;
      if (studentResults.length > 0) {
        reportHtml += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Subject</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Term</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">1st CA (10%)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">2nd CA (10%)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Assignment (20%)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Exam (60%)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Total (100%)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Grade</th>
              </tr>
            </thead>
            <tbody>
        `;
        studentResults.forEach(r => {
          const { total, grade } = { total: r.totalScore, grade: r.grade };
          reportHtml += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${getSubjectName(r.subjectSelect)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.termSelect}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.firstCaScore}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.secondCaScore}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.assignmentScore}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.examScore}</td>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>${total}</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>${grade}</strong></td>
            </tr>
          `;
        });
        reportHtml += `
            </tbody>
          </table>
        `;
      } else {
        reportHtml += `<p style="color: #888;">No results found for this student.</p>`;
      }
    });
    reportHtml += `</div>`;
    setGeneratedReport(<div dangerouslySetInnerHTML={{ __html: reportHtml }} />);
  };
  
  const sendReportByEmail = () => {
    setReportMessage(null);
    if (!generatedReport || !reportStudentSelect) {
      setReportMessage({type: 'error', text: 'Please generate an individual report first to send via Email.'});
      return;
    }
    const studentContact = getStudentContact(reportStudentSelect);
    const studentName = getStudentName(reportStudentSelect);
    console.log(`Simulating email send to ${studentContact.email} (${studentName})`);
    console.log("Email Subject: Your Academic Report");
    console.log("Email Body/Content:", generatedReport.props.dangerouslySetInnerHTML.__html);
    setReportMessage({type: 'success', text: `Report sent to ${studentName}'s email (${studentContact.email}) (simulated).`});
  };
  
  const sendReportByWhatsApp = () => {
    setReportMessage(null);
    if (!generatedReport || !reportStudentSelect) {
      setReportMessage({type: 'error', text: 'Please generate an individual report first to send via WhatsApp.'});
      return;
    }
    const studentContact = getStudentContact(reportStudentSelect);
    const studentName = getStudentName(reportStudentSelect);
    console.log(`Simulating WhatsApp send to ${studentContact.whatsapp} (${studentName})`);
    console.log("WhatsApp Message: Your Academic Report is available. Check your email or portal.");
    setReportMessage({type: 'success', text: `Report sent to ${studentName}'s WhatsApp (${studentContact.whatsapp}) (simulated).`});
  };
  
  const clearReportSelection = () => {
    setReportClassSelect('');
    setReportStudentSelect('');
    setGeneratedReport(null);
    setReportMessage(null);
  };
  
  const uniqueClasses = [''].concat([...new Set(students.map(s => s.studentClass))].sort());
  const studentsInSelectedClass = students.filter(
    s => reportClassSelect === '' || s.studentClass === reportClassSelect
  );
  
  const loading = students.length === 0 || subjects.length === 0 || results.length === 0;

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (!loggedInUser || loading) {
    return <div className="content-section">Loading data...</div>;
  }

  return (
    <div className="content-section">
      <h1>View Student Reports</h1>
      <div className="sub-section">
        <h2>Generate Reports</h2>
        {reportMessage && (
            <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', color: 'white', backgroundColor: reportMessage.type === 'success' ? '#28a745' : '#dc3545' }}>
                {reportMessage.text}
            </div>
        )}
        <select
          id="reportClassSelect"
          value={reportClassSelect}
          onChange={(e) => { setReportClassSelect(e.target.value); setReportStudentSelect(''); setGeneratedReport(null); setReportMessage(null); }}
          style={{ width: '100%', marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Select Class</option>
          {uniqueClasses.map(className => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
        <select
          id="reportStudentSelect"
          value={reportStudentSelect}
          onChange={(e) => { setReportStudentSelect(e.target.value); setGeneratedReport(null); setReportMessage(null); }}
          disabled={!reportClassSelect}
          style={{ width: '100%', marginBottom: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Select Student</option>
          {studentsInSelectedClass.map(student => (
            <option key={student._id} value={student.admissionNo}>
              {student.firstName} {student.lastName} ({student.admissionNo})
            </option>
          ))}
        </select>
        <button
          onClick={generateIndividualReport}
          style={{ marginRight: '10px', backgroundColor: 'var(--primary-blue-dark)', borderColor: 'var(--primary-blue-dark)' }}
        >
          Generate Individual Report
        </button>
        <button
          onClick={generateClassReport}
          style={{ backgroundColor: 'var(--primary-blue-dark)', borderColor: 'var(--primary-blue-dark)' }}
        >
          Generate Class Report
        </button>
        <button onClick={clearReportSelection} style={{ marginLeft: '10px', backgroundColor: '#6c757d', borderColor: '#6c757d' }}>
            Clear Selection
        </button>
        {generatedReport && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={sendReportByEmail}>Send by Email</button>
                <button onClick={sendReportByWhatsApp} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>Send by WhatsApp</button>
                <button onClick={() => window.print()}>Print Report</button>
            </div>
        )}
        <div id="reportDisplayArea" style={{ marginTop: '20px', padding: '15px', border: generatedReport ? '1px solid #ccc' : 'none', borderRadius: '8px', background: generatedReport ? 'white' : 'transparent' }}>
          {generatedReport || <p style={{color: '#888'}}>Select a class or student and click a button to generate a report.</p>}
        </div>
      </div>
    </div>
  );
}

export default ViewReports;