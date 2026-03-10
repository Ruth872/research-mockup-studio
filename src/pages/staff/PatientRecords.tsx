import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Eye, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// Mock patient data matching the MySQL schema
const mockPatients = [
  { patient_id: 1, national_id: "123456/78/1", first_name: "Ruth", last_name: "Mwenya", date_of_birth: "1990-04-15", gender: "Female", phone_number: "+260 971 234 567", email: "ruth@mail.com", blood_group: "O+", chronic_conditions: "Hypertension", allergies: "Penicillin" },
  { patient_id: 2, national_id: "234567/89/1", first_name: "Joseph", last_name: "Banda", date_of_birth: "1985-11-20", gender: "Male", phone_number: "+260 966 789 012", email: null, blood_group: "A+", chronic_conditions: null, allergies: null },
  { patient_id: 3, national_id: "345678/90/1", first_name: "Grace", last_name: "Phiri", date_of_birth: "1978-07-03", gender: "Female", phone_number: "+260 955 345 678", email: "grace.p@mail.com", blood_group: "B-", chronic_conditions: "Diabetes, Asthma", allergies: "Sulfa drugs" },
  { patient_id: 4, national_id: "456789/01/1", first_name: "David", last_name: "Tembo", date_of_birth: "2001-02-28", gender: "Male", phone_number: "+260 977 901 234", email: null, blood_group: "AB+", chronic_conditions: null, allergies: null },
  { patient_id: 5, national_id: "567890/12/1", first_name: "Mary", last_name: "Zulu", date_of_birth: "1995-09-10", gender: "Female", phone_number: "+260 968 567 890", email: "mary.z@mail.com", blood_group: "O-", chronic_conditions: "HIV", allergies: "None" },
];

const PatientRecords = () => {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null);

  const filtered = mockPatients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.national_id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Patient Records
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{mockPatients.length} registered patients</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or NRC…"
              className="rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NRC</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.patient_id}>
                  <TableCell className="font-medium text-foreground">{p.first_name} {p.last_name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.national_id}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{p.blood_group}</span></TableCell>
                  <TableCell className="text-muted-foreground">{p.phone_number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.chronic_conditions || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Patient detail modal */}
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="font-heading text-xl font-bold text-foreground">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">NRC: {selectedPatient.national_id}</p>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{selectedPatient.date_of_birth}</span></div>
                <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{selectedPatient.gender}</span></div>
                <div><span className="text-muted-foreground">Blood Group:</span> <span className="text-foreground">{selectedPatient.blood_group}</span></div>
                <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-foreground">{selectedPatient.phone_number}</span></div>
                {selectedPatient.email && (
                  <div className="col-span-2 flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-foreground">{selectedPatient.email}</span></div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div><span className="font-medium text-foreground">Allergies:</span> <span className="text-muted-foreground">{selectedPatient.allergies || "None reported"}</span></div>
                <div><span className="font-medium text-foreground">Chronic Conditions:</span> <span className="text-muted-foreground">{selectedPatient.chronic_conditions || "None reported"}</span></div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
