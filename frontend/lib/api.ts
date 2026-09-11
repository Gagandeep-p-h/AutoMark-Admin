/**
 * SmartAttend Unified Fullstack API Client
 *
 * Connects Next.js frontend with the Express + Prisma REST API backend.
 * Features:
 * - Direct or Next.js proxy routing (/api/backend/*)
 * - Automatic Authorization Bearer header injection
 * - Built-in fallback to mock data when backend or database is offline
 */

export interface BackendHealth {
  status: 'OK' | 'DOWN';
  message: string;
  uptime?: number;
  databaseConfigured?: boolean;
  timestamp?: string;
  isFallback?: boolean;
}


export interface StudentRecord {
  id: number | string;
  name: string;
  usn: string;
  department: string;
  semester: number;
  section: string;
  academicYear: string;
  email?: string;
  deviceBound: boolean;
  boundDeviceName?: string | null;
  account?: string;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  registerNumber: string;
  department?: string;
  departmentId?: number;
  semester: number;
  section: string;
  academicYear?: string;
}

export interface DepartmentRecord {
  id: number;
  name: string;
  code: string;
}

export interface FacultyRecord {
  id: number | string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation?: string;
  status: string;
}

// Client or Server base URL determination
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Browser side: use Next.js proxy rewrite to avoid CORS and port mismatches
    return '/api/backend';
  }
  return process.env.BACKEND_INTERNAL_URL 
    ? `${process.env.BACKEND_INTERNAL_URL}/api`
    : 'http://localhost:5000/api';
};

/**
 * Health check to verify if backend is reachable
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${getApiBase()}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        status: 'OK',
        message: data.message || 'API Connected',
        uptime: data.uptime,
        databaseConfigured: data.databaseConfigured,
        timestamp: data.timestamp,
        isFallback: false,
      };
    }
  } catch (e) {
    // Backend unreachable
  }

  return {
    status: 'DOWN',
    message: 'Backend API is currently offline (using demo data)',
    isFallback: true,
  };
}

/**
 * Fetch all students
 */
/**
 * Fetch students from backend (with HOD department restriction & search support)
 */
export async function getStudents(
  searchQuery?: string,
  token?: string
): Promise<{ students: StudentRecord[]; isLive: boolean; isHod?: boolean; department?: string | null }> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const queryStr = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    // Prefer the Next.js session-aware proxy in browser
    const endpoint = typeof window !== 'undefined'
      ? `/api/admin/students${queryStr}`
      : `${getApiBase()}/admin/students${queryStr}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return {
          students: json.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            usn: s.usn,
            department: s.department,
            semester: s.semester,
            section: s.section,
            academicYear: s.academicYear,
            email: s.email,
            deviceBound: s.deviceBound,
            boundDeviceName: s.boundDeviceName,
            account: 'Active',
          })),
          isLive: true,
          isHod: json.isHod,
          department: json.department,
        };
      }
    }
  } catch (err) {
    // fallback below
  }

  // Comprehensive fallback students covering all departments
  const allDemoStudents: StudentRecord[] = [
    { id: 101, name: 'Rahul Sharma', usn: '01CS123', department: 'Computer Science & Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'Pixel 8' },
    { id: 102, name: 'Ananya Singh', usn: '01CS124', department: 'Computer Science & Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'iPhone 15' },
    { id: 103, name: 'Vikram Patel', usn: '01CS125', department: 'Computer Science & Engineering', semester: 5, section: 'B', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'Galaxy S23' },
    { id: 104, name: 'Arjun Kumar', usn: '01CS127', department: 'Computer Science & Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'OnePlus 11' },
    { id: 201, name: 'Priya Sharma', usn: '01AI001', department: 'Artificial Intelligence & Machine Learning', semester: 3, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'iPhone 14' },
    { id: 202, name: 'Rohit Gupta', usn: '01AI002', department: 'Artificial Intelligence & Machine Learning', semester: 3, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
    { id: 301, name: 'Ishita Rao', usn: '01EC203', department: 'Electronics & Communication', semester: 3, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'iPhone 14' },
    { id: 302, name: 'Manoj Kumar', usn: '01EC204', department: 'Electronics & Communication', semester: 3, section: 'B', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
    { id: 401, name: 'Suresh Patil', usn: '01EE101', department: 'Electrical & Electronics Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'Galaxy A54' },
    { id: 402, name: 'Divya K', usn: '01EE102', department: 'Electrical & Electronics Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
    { id: 501, name: 'Adarsh Joshi', usn: '01ME051', department: 'Mechanical Engineering', semester: 7, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'Vivo X90' },
    { id: 502, name: 'Ramesh Patil', usn: '01ME052', department: 'Mechanical Engineering', semester: 7, section: 'B', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
    { id: 601, name: 'Sneha Kulkarni', usn: '01CV011', department: 'Civil Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'Pixel 7a' },
    { id: 602, name: 'Vijay Kumar', usn: '01CV012', department: 'Civil Engineering', semester: 5, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
    { id: 701, name: 'Pooja Nair', usn: '01DS001', department: 'Computer Science (Data Science)', semester: 3, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: true, boundDeviceName: 'iPhone 13' },
    { id: 702, name: 'Karthik Hegde', usn: '01DS002', department: 'Computer Science (Data Science)', semester: 3, section: 'A', academicYear: '2026-27', account: 'Active', deviceBound: false, boundDeviceName: null },
  ];

  let filtered = allDemoStudents;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));
  }

  return {
    students: filtered,
    isLive: false,
    isHod: false,
    department: null,
  };
}

/**
 * Create a new student via the backend
 */
export async function createStudent(payload: CreateStudentPayload, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const endpoint = typeof window !== 'undefined'
    ? '/api/admin/students'
    : `${getApiBase()}/admin/students`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to create student');
  }
  return json;
}

/**
 * Fetch departments
 */
export async function getDepartments(): Promise<DepartmentRecord[]> {
  try {
    const res = await fetch(`${getApiBase()}/departments`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {}

  return [
    { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 2, name: 'Electronics & Communication', code: 'ECE' },
    { id: 3, name: 'Information Technology', code: 'IT' },
    { id: 4, name: 'Mechanical Engineering', code: 'ME' },
  ];
}

/**
 * Fetch faculty
 */
export async function getFaculty(token?: string): Promise<{ faculty: FacultyRecord[]; isLive: boolean }> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${getApiBase()}/faculty`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return {
          faculty: json.data.map((f: any) => ({
            id: f.id,
            name: f.name || f.user?.name || 'Faculty Member',
            email: f.email || f.user?.email || '',
            employeeId: f.employeeId || `FAC-${f.id}`,
            department: f.department?.name || 'Academic Dept',
            designation: f.designation || 'Professor',
            status: 'Active',
          })),
          isLive: true,
        };
      }
    }
  } catch (err) {}

  return {
    faculty: [
      { id: 1, name: 'Dr. Ramesh Kumar', employeeId: 'FAC001', department: 'Computer Science', designation: 'Professor & HOD', email: 'ramesh@smartattend.edu', status: 'Active' },
      { id: 2, name: 'Prof. Sunita Deshmukh', employeeId: 'FAC002', department: 'Computer Science', designation: 'Associate Professor', email: 'sunita@smartattend.edu', status: 'Active' },
      { id: 3, name: 'Dr. Vivek Sharma', employeeId: 'FAC003', department: 'Electronics', designation: 'Professor', email: 'vivek@smartattend.edu', status: 'Active' },
      { id: 4, name: 'Prof. Priya Nair', employeeId: 'FAC004', department: 'Information Tech', designation: 'Assistant Professor', email: 'priya@smartattend.edu', status: 'Active' },
    ],
    isLive: false,
  };
}
