import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import axios from "axios";



const CoursesPage = async () => {


    const user = await auth()
    if(!user){
        return redirect("/login")
    }

    const courses = await (await axios.get(`${process.env.BACK_END_URL}/api/courses`)).data

    return ( 
        <div className="p-6">
           <DataTable columns={columns} data={courses} />
        </div>
     );
}
 
export default CoursesPage;