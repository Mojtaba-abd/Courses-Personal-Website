export const isTeacher = (userRole?: string | null) => {
    return userRole === "teacher" || userRole === "admin";
}