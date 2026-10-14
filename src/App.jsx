
import { useState } from 'react';
import './App.css';

const STORAGE_KEY = 'segmp_students';

const subjects = [
  'Operating Systems',
  'Data Base and Management System',
  'Software Engineering',
  'Probability and Statistics',
  'Business Environment',
  'Operating Systems Laboratory',
  'Database and Management Systems Laboratory',
  'Design Thinking and Innovation Laboratory',
  'Full Stack Development',
  'Health and Wellness'
];

const emptyMarks = subjects.map(() => '');

function getStudents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function calculateGrade(mark) {
  if (String(mark).toLowerCase() === 'ab') return 'F';

  const value = Number(mark);

  if (value >= 90) return 'S';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  if (value >= 40) return 'E';
  return 'F';
}

function calculateResult(mark) {
  if (String(mark).toLowerCase() === 'ab') return 'Absent';
  return Number(mark) >= 40 ? 'Pass' : 'Fail';
}

function calculateSGPA(marks) {
  const numericMarks = marks
    .filter((mark) => String(mark).toLowerCase() !== 'ab')
    .map(Number);

  if (numericMarks.length === 0) return null;

  const average =
    numericMarks.reduce((total, mark) => total + mark, 0) /
    numericMarks.length;

  return Number((average / 10).toFixed(2));
}

function App() {
  const [page, setPage] = useState('home');
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [marks, setMarks] = useState(emptyMarks);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [searchRoll, setSearchRoll] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  function openEnrollment() {
    setMessage('');
    setPassword('');
    setPage(unlocked ? 'enroll' : 'password');
  }

  function openResults() {
    setMessage('');
    setSearchRoll('');
    setStudentData(null);
    setPage('result');
  }

  function verifyPassword(e) {
    e.preventDefault();
    setMessage('');

    if (password !== '1234') {
      setMessage('Incorrect password. Please try again.');
      return;
    }

    setUnlocked(true);
    setPassword('');
    setPage('enroll');
  }

  function submitForm(e) {
    e.preventDefault();
    if (loading) return;

    setMessage('');

    const cleanedName = name.trim();
    const cleanedRoll = rollNumber.trim().toUpperCase();

    if (!/^[A-Za-z. ]+$/.test(cleanedName)) {
      setMessage('Enter a valid student name.');
      return;
    }

    if (!/^24HC\d{3}$/.test(cleanedRoll)) {
      setMessage('Enter a valid roll number in the format 24HC001.');
      return;
    }

    const cleanedMarks = marks.map((mark) => String(mark).trim());

    const invalidMark = cleanedMarks.some((mark) => {
      if (/^ab$/i.test(mark)) return false;
      if (mark === '') return true;

      const value = Number(mark);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });

    if (invalidMark) {
      setMessage('Enter a mark between 0 and 100, or Ab for absent, for every subject.');
      return;
    }

    setLoading(true);

    try {
      const students = getStudents();

      if (students[cleanedRoll]) {
        setMessage(
          'This roll number is already enrolled. Please use a different roll number.'
        );
        return;
      }

      const normalizedMarks = cleanedMarks.map((mark) =>
        /^ab$/i.test(mark) ? 'Ab' : Number(mark)
      );

      const resultSubjects = subjects.map((subject, index) => ({
        id: index + 1,
        subject_name: subject,
        marks: normalizedMarks[index],
        grade: calculateGrade(normalizedMarks[index]),
        result: calculateResult(normalizedMarks[index])
      }));

      const record = {
        student: {
          name: cleanedName,
          roll_number: cleanedRoll,
          branch: 'Computer Science and Engineering'
        },
        subjects: resultSubjects,
        sgpa: calculateSGPA(normalizedMarks)
      };

      students[cleanedRoll] = record;
      saveStudents(students);

      setMessage('');
      setName('');
      setRollNumber('');
      setMarks([...emptyMarks]);
      setShowSuccessModal(true);
    } catch {
      setMessage('Unable to save the record in this browser. Please check browser storage.');
    } finally {
      setLoading(false);
    }
  }

  function searchResult(e) {
    e.preventDefault();
    if (searchLoading) return;

    const cleanedRoll = searchRoll.trim().toUpperCase();

    if (!/^24HC\d{3}$/.test(cleanedRoll)) {
      setMessage('Enter a valid roll number in the format 24HC001.');
      setStudentData(null);
      return;
    }

    setSearchLoading(true);
    setMessage('');
    setStudentData(null);

    try {
      const students = getStudents();
      const record = students[cleanedRoll];

      if (!record) {
        setMessage('Roll Number Not Found. No student record exists for this roll number.');
        return;
      }

      setStudentData(record);
      setSearchRoll(cleanedRoll);
    } catch {
      setMessage('Unable to read student records from browser storage.');
    } finally {
      setSearchLoading(false);
    }
  }

  function goHome() {
    setShowSuccessModal(false);
    setMessage('');
    setPassword('');
    setPage('home');
  }

  function enrollAnotherStudent() {
    setShowSuccessModal(false);
    setMessage('');
    setName('');
    setRollNumber('');
    setMarks([...emptyMarks]);
    setPage('enroll');
  }

  function startAnotherSearch() {
    setStudentData(null);
    setSearchRoll('');
    setMessage('');
  }

  function displayMark(mark) {
    if (String(mark).toLowerCase() === 'ab') return 'Ab';
    return Number(mark);
  }

  const student = studentData?.student;
  const resultSubjects = studentData?.subjects || [];

  const overallResult = resultSubjects.some(
    (subject) =>
      String(subject.result || '').toLowerCase() === 'fail' ||
      String(subject.result || '').toLowerCase() === 'absent'
  )
    ? 'FAIL'
    : 'PASS';

  return (
    <div className={`app app-${page}`}>
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <h1>Student Enrollment And Grade Management Protocol</h1>
            <p>STUDENT ACADEMIC PORTAL</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        {page === 'home' && (
          <section className="home-card">
            <div className="eyebrow">WELCOME TO YOUR PORTAL</div>
            <h2>
              Student Enrollment
              <br />
              &amp; Grade Management
            </h2>
            <p className="home-description">
              A single place to manage student enrollment and access academic results.
            </p>

            <div className="home-actions">
              <button type="button" onClick={openEnrollment}>
                <span>01</span>
                <span>
                  <strong>Enter Details</strong>
                  <small>Enroll a student</small>
                </span>
                <span className="arrow">→</span>
              </button>

              <button type="button" onClick={openResults}>
                <span>02</span>
                <span>
                  <strong>View Result</strong>
                  <small>Check academic grades</small>
                </span>
                <span className="arrow">→</span>
              </button>
            </div>

            <div className="home-footer">ACADEMIC MANAGEMENT SYSTEM</div>
          </section>
        )}

        {page === 'password' && (
          <section className="small-card">
            <button type="button" className="close-button" onClick={goHome} aria-label="Close">
              ×
            </button>
            <div className="lock-icon">01</div>
            <div className="eyebrow">SECURE ACCESS</div>
            <h2>Authentication</h2>
            <p className="muted">Enter the enrollment password to continue.</p>

            <form onSubmit={verifyPassword}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button className="primary-button" type="submit">
                Continue <span>→</span>
              </button>
            </form>

            {message && <p className="message error" role="alert">{message}</p>}
            <button type="button" className="text-button" onClick={goHome}>
              Back to home
            </button>
          </section>
        )}

        {page === 'enroll' && (
          <section className="form-card">
            <div className="form-heading">
              <div>
                <div className="eyebrow">STUDENT RECORDS</div>
                <h2>Student Enrollment</h2>
                <p className="muted">Enter the student's details and subject marks.</p>
              </div>
              <button type="button" className="back-button" onClick={goHome}>
                ← Home
              </button>
            </div>

            <form className="enrollment-form" onSubmit={submitForm}>
              <div className="form-section-title">Student Information</div>

              <div className="form-field">
                <label htmlFor="studentName">Student Name</label>
                <input
                  id="studentName"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  pattern="[A-Za-z. ]+"
                  title="Use letters, spaces, and periods only."
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="rollNumber">Roll Number</label>
                <input
                  id="rollNumber"
                  type="text"
                  placeholder="24HC001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  pattern="24HC[0-9]{3}"
                  maxLength={7}
                  title="Enter roll number in the format 24HC001."
                  required
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="branch">Branch</label>
                <input
                  id="branch"
                  value="Computer Science and Engineering"
                  readOnly
                />
              </div>

              <div className="form-section-title full-width">
                Subject Marks <span className="section-note">10 SUBJECTS</span>
              </div>

              <p className="form-note full-width">
                Enter a mark from 0–100 or type Ab for absent.
              </p>

              {subjects.map((subject, index) => (
                <div className="subject-row" key={subject}>
                  <label htmlFor={`subject-${index}`}>
                    <span className="subject-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {subject}
                  </label>
                  <input
                    id={`subject-${index}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Marks / Ab"
                    value={marks[index]}
                    onChange={(e) => {
                      const updated = [...marks];
                      updated[index] = e.target.value;
                      setMarks(updated);
                    }}
                    required
                  />
                </div>
              ))}

              <div className="form-actions full-width">
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Enrollment'}
                  {!loading && <span>→</span>}
                </button>
                <button type="button" className="text-button" onClick={goHome}>
                  Cancel
                </button>
              </div>
            </form>

            {message && <div className="message error" role="alert">{message}</div>}
          </section>
        )}

        {page === 'result' && (
          <section className="result-area">
            {!studentData && (
              <section className="small-card search-card">
                <button type="button" className="close-button" onClick={goHome} aria-label="Close">
                  ×
                </button>
                <div className="lock-icon">02</div>
                <div className="eyebrow">ACADEMIC RECORDS</div>
                <h2>View Student Grades</h2>
                <p className="muted">
                  Enter the student's roll number to view their marksheet.
                </p>

                <form onSubmit={searchResult}>
                  <label htmlFor="searchRoll">Student Roll Number</label>
                  <input
                    id="searchRoll"
                    type="text"
                    placeholder="24HC001"
                    value={searchRoll}
                    onChange={(e) => setSearchRoll(e.target.value.toUpperCase())}
                    pattern="24HC[0-9]{3}"
                    maxLength={7}
                    title="Enter roll number in the format 24HC001."
                    required
                  />
                  <button className="primary-button" type="submit" disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'View Result'}
                    {!searchLoading && <span>→</span>}
                  </button>
                </form>

                {message && <p className="message error" role="alert">{message}</p>}
                <button type="button" className="text-button" onClick={goHome}>
                  Back to home
                </button>
              </section>
            )}

            {studentData && student && (
              <section className="marksheet">
                <div className="marksheet-header">
                  <div className="college-emblem" aria-hidden="true">S</div>
                  <div>
                    <div className="eyebrow">ACADEMIC RECORD</div>
                    <h2>STUDENT MARKSHEET</h2>
                    <p>Student Enrollment and Grade Management Protocol</p>
                  </div>
                </div>

                <div className="student-info">
                  <div>
                    <span>STUDENT NAME</span>
                    <strong>{student.name}</strong>
                  </div>
                  <div>
                    <span>ROLL NUMBER</span>
                    <strong>{student.roll_number || student.rollNumber || searchRoll}</strong>
                  </div>
                  <div className="full-width">
                    <span>BRANCH</span>
                    <strong>{student.branch || 'Computer Science and Engineering'}</strong>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="marks-table">
                    <thead>
                      <tr>
                        <th>SUBJECT</th>
                        <th>MARKS</th>
                        <th>GRADE</th>
                        <th>RESULT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultSubjects.map((subject, index) => {
                        const subjectResult = subject.result || (
                          String(subject.marks).toLowerCase() === 'ab'
                            ? 'Absent'
                            : Number(subject.marks) < 40
                              ? 'Fail'
                              : 'Pass'
                        );

                        return (
                          <tr key={subject.id || subject.subject_name || index}>
                            <td>
                              {subject.subject_name || subject.subjectName || `Subject ${index + 1}`}
                            </td>
                            <td>{displayMark(subject.marks)}</td>
                            <td>
                              <span className="grade-pill">{subject.grade || '—'}</span>
                            </td>
                            <td>
                              <span
                                className={`result-pill ${
                                  String(subjectResult).toLowerCase() === 'pass'
                                    ? 'pass'
                                    : 'fail'
                                }`}
                              >
                                {subjectResult}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="result-summary">
                  <div>
                    <span>SGPA</span>
                    <strong>
                      {studentData.sgpa === null || studentData.sgpa === undefined
                        ? '—'
                        : Number(studentData.sgpa).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span>OVERALL RESULT</span>
                    <strong className={overallResult === 'PASS' ? 'overall-pass' : 'overall-fail'}>
                      {overallResult}
                    </strong>
                  </div>
                </div>

                <div className="marksheet-footer">
                  <span>SEGMP · STUDENT ACADEMIC PORTAL</span>
                  <span>Generated from saved academic records</span>
                </div>

                <div className="marksheet-actions">
                  <button type="button" className="primary-button" onClick={() => window.print()}>
                    Print Marksheet
                  </button>
                  <button type="button" className="text-button" onClick={startAnotherSearch}>
                    Search Another Student
                  </button>
                  <button type="button" className="text-button" onClick={goHome}>
                    Back to Home
                  </button>
                </div>
              </section>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>SEGMP</span>
        <span>STUDENT ENROLLMENT &amp; GRADE MANAGEMENT</span>
      </footer>

      {showSuccessModal && (
        <div className="modal-overlay" role="presentation">
          <section
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            aria-describedby="success-modal-description"
          >
            <div className="success-icon" aria-hidden="true">✓</div>
            <div className="eyebrow">STUDENT RECORDS</div>
            <h2 id="success-modal-title">Form Submitted Successfully!</h2>
            <p id="success-modal-description">
              The student's details have been saved successfully.
            </p>
            <p className="success-question">
              Would you like to enroll another student?
            </p>
            <div className="success-actions">
              <button type="button" className="primary-button" onClick={enrollAnotherStudent}>
                Enroll Another Student
              </button>
              <button type="button" className="text-button" onClick={goHome}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
