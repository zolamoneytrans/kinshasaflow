import type { Template } from "@/lib/types";

export const templates: Template[] = [
  {
    id: "student",
    name: "Student ID",
    fields: [
      { name: "name", label: "Full Name", placeholder: "e.g. Jane Doe", type: "text" },
      { name: "idNumber", label: "Student ID Number", placeholder: "e.g. 123456", type: "text" },
      { name: "dob", label: "Date of Birth", placeholder: "", type: "date" },
      { name: "validUntil", label: "Valid Until", placeholder: "", type: "date" },
    ],
  },
  {
    id: "employee",
    name: "Employee ID",
    fields: [
      { name: "name", label: "Full Name", placeholder: "e.g. John Smith", type: "text" },
      { name: "idNumber", label: "Employee ID Number", placeholder: "e.g. EMP-7890", type: "text" },
      { name: "title", label: "Job Title", placeholder: "e.g. Software Engineer", type: "text" },
      { name: "department", label: "Department", placeholder: "e.g. Technology", type: "text" },
    ],
  },
  {
    id: "membership",
    name: "Membership Card",
    fields: [
      { name: "name", label: "Full Name", placeholder: "e.g. Alex Ray", type: "text" },
      { name: "idNumber", label: "Membership ID", placeholder: "e.g. MEM-112233", type: "text" },
      { name: "validUntil", label: "Membership Valid Until", placeholder: "", type: "date" },
    ],
  },
];
