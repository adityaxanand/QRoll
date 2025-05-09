
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, CalendarDays, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    displayName: string;
    email?: string;
  };
  studentName: string;
  sessionFirebaseId: string;
  sessionName: string;
  teacher: string; // Teacher's MongoDB ID
  qrTokenUsed: string;
  verificationConfidence?: number;
  status: string;
  timestamp: string; // ISO date string
  createdAt: string; // ISO date string
}

interface FirebaseSessionStub {
  id: string; // Firebase doc ID
  className?: string;
  createdAt: { seconds: number; nanoseconds: number }; // Firestore Timestamp structure
}

export function AttendanceList() {
  const { authToken, userProfile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<FirebaseSessionStub[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Fetch teacher's sessions (from Firestore, then will fetch attendance from backend)
  useEffect(() => {
    const fetchSessions = async () => {
      if (!userProfile?.uid || !db) return; // userProfile.uid is teacher's Firebase UID
      
      // This part is still using Firebase to get session list for the teacher
      // Ideally, sessions would also be in MongoDB or backend provides this list
      const { db } = await import('@/lib/firebase/firebase');
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');

      setIsLoadingSessions(true);
      try {
        const sessionsRef = collection(db, "classSessions");
        // Assuming userProfile.uid here is the Firebase UID of the teacher, as stored in classSessions
        const q = query(sessionsRef, where("teacherId", "==", userProfile.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedSessions: FirebaseSessionStub[] = [];
        querySnapshot.forEach(doc => {
          fetchedSessions.push({ id: doc.id, ...doc.data() } as FirebaseSessionStub);
        });
        setSessions(fetchedSessions);
        if (fetchedSessions.length > 0) {
          //setSelectedSessionId(fetchedSessions[0].id); // Auto-select first session
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast({ title: "Error", description: "Could not fetch class sessions.", variant: "destructive" });
      } finally {
        setIsLoadingSessions(false);
      }
    };

    if(userProfile?.role === 'teacher') {
        fetchSessions();
    }
  }, [userProfile, toast]);

  // Fetch attendance records when a session is selected
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!selectedSessionId || !authToken || !BACKEND_API_URL) return;
      setIsLoadingRecords(true);
      setAttendanceRecords([]); // Clear previous records
      try {
        const response = await fetch(`${BACKEND_API_URL}/attendance/session/${selectedSessionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch attendance records');
        }
        const data: AttendanceRecord[] = await response.json();
        setAttendanceRecords(data);
      } catch (error: any) {
        console.error("Error fetching attendance records:", error);
        toast({ title: "Error", description: error.message || "Could not fetch attendance records.", variant: "destructive" });
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchAttendanceRecords();
  }, [selectedSessionId, authToken, toast]);

  if (isLoadingSessions && sessions.length === 0) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading sessions...</span></div>;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Attendance Records</CardTitle>
        <CardDescription>View attendance for your class sessions. Select a session to see details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label htmlFor="session-select" className="block text-sm font-medium text-muted-foreground mb-1">Select Session:</label>
          <Select
            value={selectedSessionId || undefined}
            onValueChange={(value) => setSelectedSessionId(value)}
            disabled={isLoadingSessions || sessions.length === 0}
          >
            <SelectTrigger id="session-select" className="w-full md:w-1/2">
              <SelectValue placeholder={isLoadingSessions ? "Loading sessions..." : (sessions.length === 0 ? "No sessions found" : "Select a session")} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(session => (
                <SelectItem key={session.id} value={session.id}>
                  {session.className || `Session on ${format(new Date(session.createdAt.seconds * 1000), 'MMM d, yyyy HH:mm')}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingRecords && (
          <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading records...</span></div>
        )}

        {!isLoadingRecords && selectedSessionId && attendanceRecords.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No attendance records found for this session yet.</p>
        )}

        {!isLoadingRecords && attendanceRecords.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map(record => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">{record.student?.displayName || record.studentName}</TableCell>
                    <TableCell>{record.student?.email || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(record.timestamp), 'Pp')}</TableCell>
                    <TableCell>
                      {record.verificationConfidence !== undefined 
                        ? `${(record.verificationConfidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="capitalize">
                      <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full w-fit ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status === 'present' ? <CheckCircle className="h-3 w-3"/> : <AlertCircle className="h-3 w-3" />}
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
         {!selectedSessionId && !isLoadingSessions && sessions.length > 0 && (
            <p className="text-center text-muted-foreground py-4">Please select a session to view attendance.</p>
        )}
      </CardContent>
    </Card>
  );
}
