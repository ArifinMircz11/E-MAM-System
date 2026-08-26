export const transformToCamelCase = (data: Record<string, any>): Record<string, any> => {
  const res: Record<string, any> = {};
  for (const k in data) {
    const camel = k.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    res[camel] = data[k];
  }
  return res;
};

export const transformDocData = (data: any): any => {
  if (!data) return data;
  return { ...data, updatedAt: Date.now() };
};

export const transformStudentToV2 = (student: any): any => {
  if (!student) return student;
  return {
    ...student,
    schemaVersion: 2,
    updatedAt: Date.now(),
  };
};

export const transformTeacherToV2 = (teacher: any): any => {
  if (!teacher) return teacher;
  return {
    ...teacher,
    schemaVersion: 2,
    updatedAt: Date.now(),
  };
};
