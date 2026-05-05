export const COURSE_OPTIONS = [
  { value: 'BSIT', label: 'BSIT (Information Technology)' },
  { value: 'BSCS', label: 'BSCS (Computer Science)' },
  { value: 'BSCpE', label: 'BSCpE (Computer Engineering)' },
  { value: 'BSN', label: 'BSN (Nursing)' },
  { value: 'BSMLS', label: 'BSMLS (Medical Laboratory Science / MedTech)' },
  { value: 'BSPT', label: 'BSPT (Physical Therapy)' },
  { value: 'BS Psych', label: 'BS Psych (Psychology)' },
  { value: 'BSA', label: 'BSA (Accountancy)' },
  { value: 'BSMA', label: 'BSMA (Management Accounting)' },
  { value: 'BSBA', label: 'BSBA (Business Administration)' },
  { value: 'BSHM', label: 'BSHM (Hospitality Management)' },
  { value: 'BSTM', label: 'BSTM (Tourism Management)' },
  { value: 'BS Crim', label: 'BS Crim (Criminology)' },
  { value: 'BSFS', label: 'BSFS (Forensic Science)' },
  { value: 'BS Arch', label: 'BS Arch (Architecture)' },
  { value: 'BSCE', label: 'BSCE (Civil Engineering)' },
  { value: 'BSECE', label: 'BSECE (Electronics Engineering)' },
  { value: 'BSESE', label: 'BSESE (Environmental and Sanitary Engineering)' },
  { value: 'BSEd', label: 'BSEd (Secondary Education)' },
  { value: 'BEEd', label: 'BEEd (Elementary Education)' },
  { value: 'BPEd', label: 'BPEd (Physical Education)' },
  { value: 'BCAEd', label: 'BCAEd (Culture and Arts Education)' },
  { value: 'BSESS', label: 'BSESS (Exercise and Sports Sciences)' }
];

export const hasCourseOption = (value) => COURSE_OPTIONS.some((course) => course.value === value);

export const YEAR_LEVEL_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Irregular',
  'High School',
  'Undergraduate',
  'Graduated'
];

export const hasYearLevelOption = (value) => YEAR_LEVEL_OPTIONS.includes(value);
